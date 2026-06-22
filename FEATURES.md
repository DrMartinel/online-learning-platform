# Các Tính Năng Của Hệ Thống Online Learning Platform

Dự án Online Learning Platform là một nền tảng học trực tuyến toàn diện, được xây dựng với kiến trúc Frontend là Next.js, Backend là NestJS (Feature-Based Modules), và cơ sở dữ liệu/hạ tầng sử dụng Supabase. 

Dưới đây là danh sách chi tiết các tính năng hiện có của dự án:

## 1. Quản lý Tài khoản & Phân quyền (Auth & IAM)
- **Đăng nhập & Đăng ký**: Quản lý xác thực người dùng an toàn, được tích hợp trực tiếp với Supabase Auth.
- **Quản lý Phiên (Sessions)**: Quản lý trạng thái đăng nhập và truy cập an toàn qua JWT.
- **Phân quyền nâng cao (IAM - Identity and Access Management)**:
  - Hệ thống kiểm soát quyền truy cập dựa trên Vai trò (Role-Based Access Control).
  - Phân tách rõ ràng luồng sử dụng và quyền hạn giữa Học viên (Student) và Quản trị viên (Admin).
  - Cấu hình chi tiết các Permissions cho từng nhóm người dùng.

## 2. Quản lý Người dùng (User Management)
- **Trang cá nhân (Học viên)**: Cho phép người dùng xem, chỉnh sửa thông tin cá nhân và thiết lập tài khoản.
- **Quản lý User (Admin)**: Giao diện quản trị viên cho phép xem danh sách, thêm, sửa, phân quyền hoặc khóa tài khoản của người dùng trên toàn hệ thống.

## 3. Hệ thống Khóa học (Course Management)
- **Cấu trúc Khóa học phân cấp**: Tổ chức bài bản theo dạng **Khóa học (Course) -> Chương (Chapter) -> Bài học (Lesson)**.
- **Danh mục khóa học (Course Catalog)**: Nơi hiển thị các khóa học đã được xuất bản (published) để học viên tìm kiếm và đăng ký.
- **Khu vực học tập (Learn & My Courses)**: 
  - Không gian học tập chuyên biệt cho học viên.
  - Theo dõi tiến độ học tập (Progress Tracking), tiếp tục xem video và tài liệu bài giảng dễ dàng.
- **Quản lý Khóa học (Admin)**: 
  - Cung cấp các công cụ mạnh mẽ để giáo viên/admin tạo mới, tải lên tài liệu/video, và cấu hình các khóa học.
  - Chức năng lưu nháp (Draft) và Xuất bản (Publish).

## 4. Hệ thống Kiểm tra & Đánh giá (Exam & Assessment)
- **Ngân hàng Câu hỏi**: Lưu trữ và quản lý hệ thống câu hỏi phong phú (trắc nghiệm, tự luận, v.v.).
- **Tạo & Quản lý Bài thi (Exams)**: Cấu hình linh hoạt thời gian làm bài, điều kiện vượt qua bài thi, và gán bài thi vào các khóa học.
- **Phiên làm bài (Exam Sessions)**: 
  - Ghi nhận chi tiết quá trình học viên thực hiện bài test.
  - Tự động chấm điểm và thông báo kết quả.
  - Lưu trữ lịch sử các lần thi để học viên và admin tiện tra cứu, đánh giá.

## 5. Thanh toán & Giao dịch (Payment & Transactions)
- **Xử lý Thanh toán**: Tích hợp các cổng thanh toán (Payment Gateway) hỗ trợ học viên mua và kích hoạt khóa học trực tuyến.
- **Quản lý Giao dịch (Admin)**: Theo dõi thống kê dòng tiền, tra cứu lịch sử mua hàng, và xử lý các trạng thái đơn hàng (thành công, thất bại, đang chờ).

## 6. Tương tác & Thảo luận (Comments)
- **Hệ thống Bình luận**: Cung cấp không gian cho học viên trao đổi, đặt câu hỏi cho giảng viên hoặc thảo luận với các học viên khác trực tiếp tại mỗi bài học.

## 7. Trợ lý Ảo AI Tích hợp (RAG - Retrieval-Augmented Generation)
- **Hỗ trợ thông minh**: Tích hợp công nghệ RAG giúp xây dựng Chat Widget thông minh.
- **Tra cứu kiến thức (Knowledge Base)**: Trợ lý AI có khả năng tự động đọc hiểu tài liệu khóa học và nội quy nền tảng để giải đáp thắc mắc của học viên theo thời gian thực (ví dụ: hỗ trợ giải thích bài giảng, hướng dẫn sử dụng hệ thống).

## 8. Phân tích & Báo cáo (System Analytics)
- **Bảng Điều khiển (Dashboard)**: Cung cấp góc nhìn tổng quan cho Admin thông qua biểu đồ và số liệu.
- **Báo cáo chi tiết**: Đo lường các chỉ số quan trọng như tăng trưởng người dùng, doanh thu, tỷ lệ hoàn thành khóa học và mức độ tương tác của học viên.

---
*Tài liệu này được tổng hợp dựa trên cấu trúc các tính năng hiện hành (Feature Modules) của Backend và hệ thống định tuyến (Routing) trên Frontend của dự án.*
