# Kiến trúc hệ thống

## 1. Tổng quan

Backend là một **modular monolith** dùng NestJS, tổ chức theo **CQRS** và
**Clean Architecture**. Mỗi module nghiệp vụ tự chứa domain, application,
infrastructure và presentation; giao tiếp qua command/query bus, ghi audit bằng
command trong cùng transaction.

```mermaid
flowchart LR
    Client[Web/Mobile client] -->|HTTP JSON| API[NestJS API]
    API --> Auth[AuthGuard]
    Auth --> Perm[PermissionsGuard]
    Perm --> CQRS[CommandBus / QueryBus]
    CQRS --> App[Application handlers]
    App --> Domain[Domain aggregates]
    App --> UoW[Unit of Work]
    UoW --> PG[(PostgreSQL)]
    App --> AuditCmd[RecordAuditLogCommand]
    AuditCmd --> UoW
    API --> Redis[(Redis: refresh token)]
```

Thành phần ngoài:

| Thành phần | Vai trò | Trạng thái |
|---|---|---|
| PostgreSQL 18 | Dữ liệu nghiệp vụ và audit | ✅ |
| Redis 8 | Refresh token, AOF bật | ✅ |
| PSP (VNPay/MoMo) | Thanh toán | ⬜ thiết kế |
| Đơn vị vận chuyển | Giao hàng | ⬜ thiết kế |
| Email/SMS | Thông báo | ⬜ |

## 2. Phân lớp

```
presentation  → HTTP, DTO, guard, map request
application   → command/query handler, port, read model
domain        → aggregate, value object, enum, repository interface, event
infrastructure→ MikroORM entity, repository impl, mapper, adapter
```

Quy tắc phụ thuộc:

- `domain` không import NestJS ORM/HTTP (chỉ dùng exception của Nest ở một số
  aggregate để thống nhất lỗi nghiệp vụ).
- `application` phụ thuộc `domain` + port, không phụ thuộc MikroORM.
- `infrastructure` hiện thực port, là nơi duy nhất biết `Mikro*`.
- `presentation` không gọi repository trực tiếp, chỉ dùng bus.

## 3. Bản đồ module

```mermaid
flowchart TB
    App[AppModule]
    App --> AuthN[authentication]
    App --> AuthZ[authorization]
    App --> Users[users]
    App --> Customers[customers]
    App --> Products[products]
    App --> Suppliers[suppliers]
    App --> GR[goods-receipts]
    App --> Inv[inventories]
    App --> Orders[orders - empty]
    App --> Expenses[expenses]
    App --> Audit[audit-logs]
    App --> UoW[shared/unit-of-work]
    App --> Security[shared/security]

    AuthN --> Users
    AuthN --> Customers
    AuthZ --> Users
    GR --> Inv
    GR --> UoW
    Inv --> UoW
    Audit --> UoW
    Products --> UoW
    Suppliers --> UoW
    Expenses --> UoW
```

| Module | Trách nhiệm |
|---|---|
| `authentication` | Account, mật khẩu, JWT, refresh token |
| `authorization` | Role, permission, kiểm tra quyền |
| `users` | Người dùng nội bộ |
| `customers` | Hồ sơ khách hàng |
| `products` | Danh mục sản phẩm |
| `suppliers` | Nhà cung cấp |
| `goods-receipts` | Phiếu nhập, dòng phiếu, xác nhận/huỷ |
| `inventories` | Lô, tồn kho, xuất kho, kiểm kê, nhập kho khi xác nhận phiếu |
| `orders` | Đơn hàng (chưa triển khai) |
| `expenses` | Chi phí vận hành |
| `audit-logs` | Ghi audit trong transaction, tra cứu audit |
| `shared/unit-of-work` | Bọc transaction |
| `shared/security` | Guard, decorator actor/permission |

## 4. Luồng xử lý một request ghi

Ví dụ `POST /api/goods-receipts`:

```mermaid
sequenceDiagram
    participant C as Client
    participant Ctrl as Controller
    participant AG as AuthGuard
    participant PG as PermissionsGuard
    participant CB as CommandBus
    participant H as Handler
    participant UoW as UnitOfWork
    participant Repo as Repository
    participant Audit as RecordAuditLogCommand
    participant DB as PostgreSQL

    C->>Ctrl: POST /goods-receipts + Bearer token
    Ctrl->>AG: verify JWT
    AG-->>Ctrl: user payload
    Ctrl->>PG: check goods_receipts:create
    PG-->>Ctrl: allowed
    Ctrl->>CB: CreateGoodsReceiptCommand
    CB->>H: execute(command)
    H->>UoW: run(transaction)
    UoW->>DB: BEGIN
    H->>Repo: create aggregate
    Repo->>DB: INSERT goods_receipts + lines
    H->>Audit: dispatch command(recordAuditProps(...))
    Audit->>DB: INSERT audit_logs
    UoW->>DB: COMMIT
    H-->>Ctrl: { id, code }
    Ctrl-->>C: 201 JSON
```

Điểm quan trọng:

- **Transaction boundary nằm ở handler**, không ở controller.
- Audit được ghi **cùng transaction** với dữ liệu nghiệp vụ qua
  `RecordAuditLogCommand`.
- Handler trả read model tối thiểu (`{ id }`, `{ id, code }`), không trả aggregate.

## 5. Ghi audit và command có side-effect

```mermaid
sequenceDiagram
    participant H as Command handler
    participant CB as CommandBus
    participant UoW as UnitOfWork
    participant DB as PostgreSQL

    H->>UoW: run(transaction)
    UoW->>DB: BEGIN
    H->>CB: RecordAuditLogCommand(recordAuditProps(...))
    CB->>DB: INSERT audit_logs
    H->>CB: ReceiveStockCommand / CreateExpenseCommand / DeactivateUserCommand (khi cần)
    CB->>DB: Cập nhật nghiệp vụ liên quan
    UoW->>DB: COMMIT
```

Đặc tính:

- **Cùng transaction**: audit và dữ liệu nghiệp vụ commit/rollback cùng nhau.
- **Không có relay/polling/retry queue**: command được dispatch trực tiếp trong
  `IUnitOfWork.run()`; audit có ngay sau khi request trả kết quả.
- **Side-effect đồng bộ**: nhập kho (`ReceiveStockCommand`), tạo chi phí
  (`CreateExpenseCommand`) và vô hiệu hoá user (`DeactivateUserCommand`) chạy
  trong cùng transaction; `EMPLOYEE_RESIGNED_EVENT` cũ đã được thay bằng
  `DeactivateUserCommand`.
- **Lỗi là rollback**: không có trạng thái "pending" để xử lý về sau.

Action đang được ghi audit (truyền vào `recordAuditProps`):

```
role.created, permission.granted, role.renamed, permission.revoked,
role.super_admin_set, account.signed_up, account.signed_in,
user.created, user.email_changed, user.role_assigned, user.role_removed,
product.created, supplier.created/updated/activated/deactivated,
goods_receipt.created/confirmed/cancelled,
inventory.stock_issued, inventory.stock_reconciled,
expense.created/updated/approved/supplier_paid/paid/cancelled
```

## 6. Xác thực và phân quyền

### Đăng nhập

1. `POST /api/authentication/login` kiểm tra email + Argon2id.
2. Phát access token (JWT, 15 phút) và refresh token (7 ngày).
3. Refresh token lưu Redis, gửi qua cookie `httpOnly`.
4. Client gửi access token ở header `Authorization: Bearer ...`.
5. `POST /api/authentication/refresh` đọc cookie, xoay token, trả access mới.

### Guard

- `AuthGuard`: verify JWT, gắn payload vào `request.user`.
- `PermissionsGuard`: đọc permission yêu cầu từ metadata, query role của user,
  kiểm tra khớp. Super Admin bỏ qua.
- `@ActorContext()`: gom `actorId`, `email`, IP, user-agent để đưa vào audit log.

### Mô hình quyền

```
users.role_ids[] ──> roles.permissions[] ──> permission catalog
                         └── is_super_admin
```

Role/permission lưu dạng mảng text; kiểm tra bằng hàm thuần trong domain, không
phụ thuộc DB.

## 7. Dữ liệu và transaction

| Chủ đề | Quyết định |
|---|---|
| Tiền | `bigint` VND, value object `Money`/`UnitPrice`/`UnitCost` |
| ID | UUID v4, sinh ở domain (`Id.generate`) |
| Optimistic lock | `roles.version`; các aggregate khác chưa dùng |
| Pessimistic lock | `SELECT ... FOR UPDATE` khi xuất/kiểm kê kho |
| Tồn kho | Nguồn sự thật là `batches`; `inventories` là view |
| Hạn dùng | `date` cho `expires_at` |
| Audit | Append-only, INSERT trực tiếp trong transaction nghiệp vụ |
| Command có side-effect | Dispatch trong `IUnitOfWork.run()`, cùng transaction |

## 8. Cấu trúc thư mục

```
backend/src/
├── modules/
│   ├── authentication/
│   │   ├── application/commands|ports
│   │   ├── domain/
│   │   ├── infrastructure/entities|repositories|mappers|adapters
│   │   └── presentation/authentication
│   ├── authorization/
│   ├── users/
│   ├── customers/
│   ├── products/
│   ├── suppliers/
│   ├── goods-receipts/
│   ├── inventories/
│   ├── orders/                # module rỗng
│   ├── expenses/
│   └── audit-logs/
├── shared/
│   ├── modules/security/
│   ├── modules/unit-of-work/
│   ├── types/
│   └── value-objects/
├── migrations/
├── app.module.ts
└── main.ts
```

## 9. Quyết định kiến trúc

| # | Quyết định | Lý do | Đánh đổi |
|---|---|---|---|
| ADR-01 | Modular monolith thay vì microservice | Phạm vi đồ án, transaction đơn giản | Khó scale độc lập từng module |
| ADR-02 | CQRS nhẹ (command/query bus), không event sourcing | Đủ tách đọc/ghi, ít phức tạp | Read model phải viết tay |
| ADR-03 | Ghi audit và side-effect bằng command trong cùng transaction | Không cần broker hay relay, dữ liệu luôn nhất quán | Transaction ghi dài hơn; lỗi audit làm rollback nghiệp vụ |
| ADR-04 | Domain không phụ thuộc ORM | Test nhanh, dễ thay hạ tầng | Phải viết mapper thủ công |
| ADR-05 | `bigint` VND | Chính xác tuyệt đối | Convert `number` ở ranh giới JSON (giới hạn `10^15` < `2^53`) |
| ADR-06 | Một nhà thuốc, không multi-tenant | Đúng phạm vi | Không tái sử dụng cho SaaS |
| ADR-07 | Permission dạng chuỗi trong mảng | Đơn giản, dễ kiểm tra | Không có FK, cần validate catalog |
| ADR-08 | Refresh token ở Redis | Thu hồi được, không stateless hoàn toàn | Phụ thuộc Redis |

## 10. Điểm mở rộng

- Thêm module mới: tạo `domain` + `application` + `infrastructure` +
  `presentation`, đăng ký repository token trong module.
- Thêm action audit: khai báo action trong `AUDITED_EVENT_ACTIONS`, gọi
  `RecordAuditLogCommand` trong handler cùng transaction.
- Thêm permission: khai báo trong `PERMISSIONS`; guard tự nhận.
- Thêm read model: query handler trả DTO, không trả aggregate.

## 11. Khoảng trống đã biết

| Khoảng trống | Ảnh hưởng |
|---|---|
| `orders` rỗng | Chưa có luồng mua hàng end-to-end |
| `customers` thiếu hồ sơ/địa chỉ | Không giao hàng được |
| `products` thiếu SKU/category/unit | Khó quản lý và lọc |
| Lô hết hạn/hết số lượng chưa tự chuyển trạng thái | Đã chặn khi xuất đơn; vẫn cần job cập nhật trạng thái |
| Chưa có báo cáo chi phí | Chưa tổng hợp chi phí theo nhóm/thời gian |
| Audit và side-effect ghi trong transaction API | Chưa có cơ chế giãn tải cho khối ghi nặng |
| Không có rate limit/health check | Thiếu lớp bảo vệ vận hành |
