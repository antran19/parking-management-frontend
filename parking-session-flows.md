# Tong hop 3 luong check-in/check-out trong he thong bai xe

Tai lieu nay tom tat chi tiet 3 luong chinh trong `ParkingSessionService.java`:

1. Khach vang lai, khong dat cho
2. Khach dat cho truoc
3. Khach co ve thang

Muc tieu cua cac luong la tao phien gui xe, gan khu do phu hop, xac nhan xe vao dung zone, tinh phi khi ra bai va giai phong suc chua zone.

## 1. Luong khach vang lai, khong dat cho

Khach vang lai la xe khong co reservation hop le va khong co ve thang hop le. Khi check-in, he thong tu dong tim zone con trong phu hop voi loai xe.

### 1.1. Check-in tai cong chinh

Staff nhap cac thong tin:

- Bien so xe hoac ma xe dap
- Loai phuong tien
- Cong vao
- Ghi chu neu co

He thong thuc hien validate:

1. Bai xe khong duoc o trang thai khan cap.
2. Loai phuong tien phai ton tai.
3. Cong vao phai ton tai va dang hoat dong.
4. Bien so xe khong duoc rong, tru truong hop xe dap.
5. Bien so xe phai dung dinh dang, vi du `51F-123.45`, `30A-12345`, `59X1-12345`.
6. Bien so hoac ma xe khong duoc co session dang `ACTIVE`.
7. Xe khong nam trong blacklist.
8. Neu co ve thang thi kiem tra rieng theo luong ve thang.

Neu khong co reservation hop le, he thong goi y zone tu dong.

Tieu chi chon zone:

1. Zone phai dung loai phuong tien.
2. Zone phai co trang thai `ACTIVE`.
3. Zone phai con cho.
4. Zone phai co cong vao zone dang hoat dong.
5. Uu tien zone co tong `currentCount + reservedCount` thap nhat.
6. Neu bang nhau thi uu tien zone co khoang cach toi cong gan hon.

Sau khi chon zone:

1. He thong tang `currentCount` cua zone len 1.
2. Neu `currentCount + reservedCount >= capacity`, zone duoc chuyen sang `FULL`.
3. Tao `ParkingSession` moi voi trang thai `ACTIVE`.
4. `driverType` mac dinh la `WALK_IN`.
5. `zoneEntryTime` ban dau la `null`, vi xe moi qua cong chinh, chua quet vao zone.
6. He thong tra ve ma session/QR va huong dan zone cho khach.

### 1.2. Check-in vao zone

Khi xe toi cong zone, staff hoac thiet bi quet:

- Ma session
- QR code
- Hoac bien so/ma xe

He thong validate:

1. Phai tim thay session dang `ACTIVE`.
2. Session chua duoc check-in vao zone truoc do, tuc la `zoneEntryTime = null`.
3. Cong zone phai ton tai.
4. Cong zone phai dang hoat dong.
5. Loai cong phai la `ZONE_ENTRY` hoac `ZONE_BOTH`.
6. Cong phai duoc lien ket voi mot zone cu the.
7. Zone cua cong phai dung loai xe voi session.
8. Zone cua cong phai trung voi zone da duoc gan trong session.

Neu xe vao dung zone:

1. Luu cong zone vao `entryZoneGate`.
2. Cap nhat `zoneEntryTime = now`.
3. Mo barrier.
4. Broadcast thay doi suc chua zone.

Neu xe vao sai zone:

- He thong tu choi vao cong.
- Code hien tai chan tat ca truong hop sai zone, ke ca khach vang lai, khach dat truoc va ve thang.

Luu y quan trong: `currentCount` da duoc tang o buoc check-in cong chinh, nen buoc check-in vao zone khong tang so luong xe them lan nua. Buoc nay chi xac nhan xe vao dung khu.

### 1.3. Check-out

Khi xe ra bai, staff nhap:

- Session ID, ma session, hoac bien so
- Cong ra
- Phuong thuc thanh toan

He thong xu ly:

1. Kiem tra bai khong o trang thai khan cap.
2. Tim session dang `ACTIVE`.
3. Kiem tra cong ra ton tai va dang hoat dong.
4. Lay `exitTime = now`.
5. Tinh thoi gian gui xe.
6. Tinh phi gui xe.
7. Cap nhat session sang `COMPLETED`.
8. Tao payment voi trang thai `COMPLETED`.
9. Giam `currentCount` cua zone.
10. Neu zone dang `FULL` va sau khi giam con cho, chuyen zone ve `ACTIVE`.

### 1.4. Cong thuc tinh phi khach vang lai

Cong thuc tinh phi:

```text
Thoi gian gui = Gio ra - Gio vao
Phut tinh tien = max(0, Thoi gian gui - freeMinutes)
So gio tinh tien = ceil(Phut tinh tien / 60)
Tong phi = So gio tinh tien * pricePerUnit
```

Neu thoi gian gui nho hon 1 phut, he thong tinh toi thieu 1 phut.

Bang gia duoc lay theo:

```text
building cua zone
+ vehicleType cua xe
+ pricingType = HOURLY
```

Neu chua cau hinh bang gia, he thong dung gia mac dinh:

```text
5.000d / gio
```

Vi du:

```text
Gio vao: 08:00
Gio ra: 09:20
Thoi gian gui: 80 phut
Mien phi: 10 phut
Phut tinh tien: 80 - 10 = 70 phut
So gio tinh tien: ceil(70 / 60) = 2 gio
Gia: 5.000d/gio
Tong phi: 2 * 5.000 = 10.000d
```

## 2. Luong khach dat cho truoc

Khach dat cho truoc la khach co reservation hop le. Khac biet lon nhat so voi khach vang lai la zone khong duoc goi y tu dong, ma lay tu reservation da dat truoc.

### 2.1. Check-in tai cong chinh co reservation code

Staff nhap:

- Bien so hoac ma xe
- Loai phuong tien
- Cong vao
- Reservation code

He thong validate chung giong khach vang lai:

1. Bai xe khong khan cap.
2. Loai phuong tien ton tai.
3. Cong vao ton tai va dang hoat dong.
4. Bien so/mapping xe hop le.
5. Xe chua co session `ACTIVE`.
6. Xe khong nam trong blacklist, tru xe dap.

Sau do validate reservation:

1. Reservation code phai ton tai.
2. Reservation phai co status `CONFIRMED` hoac `PENDING`.
3. Bien so/ma xe trong request phai khop voi reservation.
4. Loai phuong tien phai khop voi reservation.

Neu hop le:

1. Zone duoc gan bang `reservation.getZone()`.
2. Giam `reservedCount` cua zone neu dang lon hon 0.
3. Tang `currentCount` cua zone len 1.
4. Tao session `ACTIVE`.
5. Gan `driverType = PRE_BOOKED`, tru khi xe co ve thang hop le thi uu tien `SUBSCRIBER`.
6. Cap nhat reservation sang `COMPLETED`.

Luu y theo code hien tai: neu FE truyen truc tiep `reservationCode`, service chi kiem tra status, bien so va loai xe. Nhanh nay khong check khung gio `reservedFrom/reservedTo`.

### 2.2. Check-in tai cong chinh khong truyen reservation code

Neu khong truyen `reservationCode`, he thong co the tu dong match reservation theo bien so/ma xe.

Dieu kien match:

1. Reservation co status `CONFIRMED` hoac `PENDING`.
2. Bien so/ma xe khop.
3. Reservation thuoc cung building voi cong vao.
4. Thoi gian hien tai nam trong khoang hop le:

```text
reservedFrom - 60 phut <= now <= reservedTo
```

5. Loai phuong tien phai khop.

Neu tim thay reservation hop le, he thong xu ly giong truong hop co `reservationCode`: lay zone tu reservation, giam `reservedCount`, tang `currentCount`, tao session `PRE_BOOKED`, va chuyen reservation sang `COMPLETED`.

### 2.3. Check-in vao zone

Khach dat truoc phai vao dung zone da dat.

He thong validate:

1. Session phai dang `ACTIVE`.
2. Xe chua vao zone truoc do.
3. Cong zone phai ton tai va dang hoat dong.
4. Cong zone phai la cong vao zone.
5. Cong zone phai lien ket voi zone.
6. Zone cua cong phai dung loai xe.
7. Zone cua cong phai trung voi zone trong session.

Neu sai zone:

- He thong tu choi mo barrier.
- Thong bao zone dung tren ve va yeu cau xe di toi dung cong zone.

### 2.4. Check-out

Check-out cua khach dat truoc hien tai tinh phi giong khach vang lai, tru khi khach do co ve thang hop le.

Quy trinh:

1. Tim session `ACTIVE`.
2. Tinh thoi gian gui xe tu `entryTime` den `exitTime`.
3. Ap dung bang gia `HOURLY` theo building va loai xe.
4. Tao payment.
5. Cap nhat session `COMPLETED`.
6. Giam `currentCount` cua zone.

Tom lai: dat cho truoc dam bao co zone giu cho khach, nhung phi check-out van tinh theo thoi gian gui xe thuc te.

## 3. Luong khach co ve thang
 
Khach ve thang la xe co `ParkingPass` hop le tai dung building. Khac biet lon nhat la khi check-out, phi gui xe bang 0.

### 3.1. Check-in tai cong chinh

Staff nhap:

- Bien so xe
- Loai phuong tien
- Cong vao

He thong validate chung:

1. Bai xe khong khan cap.
2. Loai phuong tien ton tai.
3. Cong vao ton tai va dang hoat dong.
4. Bien so hop le.
5. Xe chua co session `ACTIVE`.
6. Xe khong nam trong blacklist.

Sau do he thong tim ve thang theo:

```text
bien so xe
+ building cua cong vao
+ status = ACTIVE
```

Ve thang hop le khi:

```text
startDate <= hom nay <= endDate
```

Neu co ve thang hop le:

1. Kiem tra loai xe cua ve thang phai khop voi loai xe dang check-in.
2. Neu khong khop, he thong chan check-in.
3. Neu khop, session se duoc gan `driverType = SUBSCRIBER`.

Sau do he thong van gan zone giong khach khong dat cho:

1. Tim zone dung loai xe.
2. Zone dang `ACTIVE`.
3. Zone con cho.
4. Zone co cong vao zone dang hoat dong.
5. Uu tien zone it xe hon va gan hon.

Sau khi gan zone:

1. Tang `currentCount`.
2. Neu day thi chuyen zone sang `FULL`.
3. Tao session `ACTIVE`.

### 3.2. Check-in vao zone

Khach ve thang van phai vao dung zone duoc gan.

Validate giong cac luong khac:

1. Session phai `ACTIVE`.
2. Xe chua vao zone truoc do.
3. Cong zone ton tai va dang hoat dong.
4. Cong zone phai la `ZONE_ENTRY` hoac `ZONE_BOTH`.
5. Zone cua cong phai dung loai xe.
6. Zone cua cong phai trung voi zone trong session.

Neu dung zone:

- Ghi nhan `zoneEntryTime`.
- Mo barrier.

Neu sai zone:

- Tu choi vao cong.

### 3.3. Check-out

Khi check-out, he thong van tinh thoi gian gui xe de luu lich su:

```text
durationMinutes = exitTime - entryTime
```

Nhung khi tinh phi:

```text
Neu driverType = SUBSCRIBER
=> totalFee = 0d
```

Sau do:

1. Cap nhat session sang `COMPLETED`.
2. Tao payment voi amount `0`.
3. Giam `currentCount` cua zone.
4. Neu zone dang `FULL` va sau khi giam con cho, chuyen ve `ACTIVE`.

## 4. Bang so sanh nhanh

| Tieu chi | Khach vang lai | Khach dat cho truoc | Khach ve thang |
| --- | --- | --- | --- |
| Cach gan zone | He thong tu goi y | Lay zone tu reservation | He thong tu goi y |
| Driver type | `WALK_IN` | `PRE_BOOKED` | `SUBSCRIBER` |
| Can reservation | Khong | Co | Khong |
| Can ve thang | Khong | Khong bat buoc | Co |
| Check blacklist | Co, tru xe dap | Co, tru xe dap | Co |
| Check trung session ACTIVE | Co | Co | Co |
| Check-in vao zone | Phai dung zone duoc gan | Phai dung zone da dat | Phai dung zone duoc gan |
| Tinh phi | Theo gio | Theo gio | 0d |
| Giai phong zone khi checkout | Co | Co | Co |

## 5. Cau noi thuyet trinh goi y

He thong chia luong gui xe thanh hai buoc vao va mot buoc ra. Buoc dau tien la check-in tai cong chinh de validate xe, tao session va gan zone. Buoc thu hai la check-in tai cong zone de dam bao xe vao dung khu da duoc chi dinh. Khi check-out, he thong lay gio ra tru gio vao de tinh thoi gian gui, sau do ap dung bang gia theo gio doi voi khach vang lai va khach dat truoc. Rieng khach ve thang duoc nhan dien bang parking pass hop le nen phi check-out bang 0 dong.

Khac biet chinh giua ba luong nam o cach gan zone va cach tinh phi. Khach vang lai duoc he thong tu dong goi y zone con trong. Khach dat cho truoc duoc gan dung zone trong reservation. Khach ve thang cung duoc goi y zone nhu khach vang lai, nhung khi ra bai thi khong tinh phi theo gio.
