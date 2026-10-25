import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const entries: Array<[string, string, string, string]> = [
  ['File', 'Tệp', '文件', 'Файл'],
  ['Edit', 'Chỉnh sửa', '编辑', 'Правка'],
  ['View', 'Xem', '视图', 'Вид'],
  ['Preferences', 'Tùy chọn', '偏好设置', 'Настройки'],
  ['Measure & Calculate', 'Đo lường & Tính toán', '测量与计算', 'Измерения и вычисления'],
  ['Measure & Calculate ▾', 'Đo lường & Tính toán', '测量与计算', 'Измерения и вычисления'],
  ['Geometric Measure', 'Đo hình học', '几何测量', 'Геометрические измерения'],
  ['Distance / Length', 'Khoảng cách / Độ dài', '距离 / 长度', 'Расстояние / Длина'],
  ['Angle (3 Points)', 'Góc (3 điểm)', '角度（三点）', 'Угол (3 точки)'],
  ['Circumference (Circle)', 'Chu vi (đường tròn)', '周长（圆）', 'Длина окружности'],
  ['Area (Polygon / Circle)', 'Diện tích (đa giác / đường tròn)', '面积（多边形 / 圆）', 'Площадь (многоугольник / круг)'],
  ['Scientific Calculator', 'Máy tính khoa học', '科学计算器', 'Инженерный калькулятор'],
  ['Circles & Lines ▾', 'Đường tròn & Đường thẳng', '圆与直线', 'Окружности и прямые'],
  ['Circles & Lines', 'Đường tròn & Đường thẳng', '圆与直线', 'Окружности и прямые'],
  ['Construction ▾', 'Dựng hình', '几何作图', 'Построения'],
  ['Construction', 'Dựng hình', '几何作图', 'Построения'],
  ['Transformations ▾', 'Phép biến hình', '几何变换', 'Преобразования'],
  ['Transformations', 'Phép biến hình', '几何变换', 'Преобразования'],
  ['Triangle Centers ▾', 'Tâm tam giác', '三角形中心', 'Центры треугольника'],
  ['Triangle Centers', 'Tâm tam giác', '三角形中心', 'Центры треугольника'],
  ['Conic Sections ▾', 'Đường conic', '圆锥曲线', 'Конические сечения'],
  ['Conic Sections', 'Đường conic', '圆锥曲线', 'Конические сечения'],
  ['Text / Formula', 'Văn bản / Công thức', '文本 / 公式', 'Текст / Формула'],
  ['Text', 'Văn bản', '文本', 'Текст'],
  ['Note', 'Ghi chú', '笔记', 'Заметки'],
  ['Tools', 'Công cụ', '工具', 'Инструменты'],
  ['Move / Select', 'Di chuyển / Chọn', '移动 / 选择', 'Перемещение / Выбор'],
  ['Pen', 'Bút', '画笔', 'Ручка'],
  ['Highlighter', 'Bút đánh dấu', '荧光笔', 'Маркер'],
  ['Eraser', 'Tẩy', '橡皮擦', 'Ластик'],
  ['Hide', 'Ẩn', '隐藏', 'Скрыть'],
  ['Show', 'Hiện', '显示', 'Показать'],
  ['Point', 'Điểm', '点', 'Точка'],
  ['Segment', 'Đoạn thẳng', '线段', 'Отрезок'],
  ['Line', 'Đường thẳng', '直线', 'Прямая'],
  ['Circle', 'Đường tròn', '圆', 'Окружность'],
  ['Polygon', 'Đa giác', '多边形', 'Многоугольник'],
  ['Angle', 'Góc', '角', 'Угол'],
  ['Intersect', 'Giao điểm', '交点', 'Пересечение'],
  ['Locus', 'Quỹ tích', '轨迹', 'ГМТ'],
  ['New File', 'Tệp mới', '新建文件', 'Новый файл'],
  ['New Page', 'Trang mới', '新建页面', 'Новая страница'],
  ['Open File', 'Mở tệp', '打开文件', 'Открыть файл'],
  ['Save .gnote', 'Lưu .gnote', '保存 .gnote', 'Сохранить .gnote'],
  ['Save', 'Lưu', '保存', 'Сохранить'],
  ['Open', 'Mở', '打开', 'Открыть'],
  ['Cancel', 'Hủy', '取消', 'Отмена'],
  ['Close', 'Đóng', '关闭', 'Закрыть'],
  ['Delete', 'Xóa', '删除', 'Удалить'],
  ['Duplicate Page', 'Nhân đôi trang', '复制页面', 'Дублировать страницу'],
  ['Delete Page', 'Xóa trang', '删除页面', 'Удалить страницу'],
  ['Collapse Pages Panel', 'Thu gọn bảng trang', '收起页面栏', 'Свернуть панель страниц'],
  ['Expand Pages Panel', 'Mở rộng bảng trang', '展开页面栏', 'Развернуть панель страниц'],
  ['Jump to Page', 'Đi tới trang', '跳转到页面', 'Перейти к странице'],
  ['Pages', 'Trang', '页面', 'Страницы'],
  ['Page', 'Trang', '页面', 'Страница'],
  ['Zoom', 'Thu phóng', '缩放', 'Масштаб'],
  ['Reset Zoom to 100%', 'Đặt lại thu phóng về 100%', '重置缩放为 100%', 'Сбросить масштаб до 100%'],
  ['Create New Document / File', 'Tạo tài liệu / tệp mới', '创建新文档 / 文件', 'Создать документ / файл'],
  ['Add a new file to your workspace anytime', 'Thêm tệp mới vào không gian làm việc bất cứ lúc nào', '随时向工作区添加新文件', 'Добавьте новый файл в рабочую область'],
  ['File Name / Title:', 'Tên tệp / Tiêu đề:', '文件名 / 标题：', 'Имя файла / Название:'],
  ['Select Starting Template:', 'Chọn mẫu bắt đầu:', '选择起始模板：', 'Выберите шаблон:'],
  ['Blank Document', 'Tài liệu trống', '空白文档', 'Пустой документ'],
  ['Math Graph Paper', 'Giấy ô ly toán học', '数学方格纸', 'Математическая сетка'],
  ['Ruled Notebook', 'Vở kẻ dòng', '横线笔记本', 'Линованный блокнот'],
  ['Default Drawing Preferences', 'Tùy chọn vẽ mặc định', '默认绘图偏好设置', 'Настройки рисования по умолчанию'],
  ['Point Size', 'Kích thước điểm', '点大小', 'Размер точки'],
  ['Line Thickness', 'Độ dày đường', '线条粗细', 'Толщина линии'],
  ['Color', 'Màu sắc', '颜色', 'Цвет'],
  ['Angle Settings', 'Cài đặt góc', '角度设置', 'Настройки угла'],
  ['Shading Type', 'Kiểu tô', '阴影类型', 'Тип заливки'],
  ['Solid Sector', 'Hình quạt đặc', '实心扇形', 'Сектор'],
  ['Hatched Lines', 'Đường gạch', '阴影线', 'Штриховка'],
  ['Single Arc', 'Một cung', '单弧', 'Одна дуга'],
  ['Double Arc', 'Hai cung', '双弧', 'Двойная дуга'],
  ['Right Angle ⦜', 'Góc vuông ⦜', '直角 ⦜', 'Прямой угол ⦜'],
  ['Angle Label (or degree)', 'Nhãn góc (hoặc độ)', '角度标签（或度数）', 'Метка угла (или градусы)'],
  ['Arc Size / Radius', 'Kích thước cung / Bán kính', '弧大小 / 半径', 'Размер дуги / Радиус'],
  ['Line / Arc Color', 'Màu đường / cung', '线条 / 弧线颜色', 'Цвет линии / дуги'],
  ['Fill Tint', 'Màu tô', '填充色', 'Цвет заливки'],
  ['Geometry Lesson', 'Bài học hình học', '几何课程', 'Урок геометрии'],
  ['Eye Protection', 'Bảo vệ mắt', '护眼模式', 'Защита зрения'],
  ['Zoom Level', 'Mức thu phóng', '缩放级别', 'Уровень масштаба'],
  ['Paper Pattern', 'Kiểu giấy', '纸张样式', 'Разметка бумаги'],
  ['blank', 'trắng', '空白', 'чистый'],
  ['ruled', 'kẻ dòng', '横线', 'линейка'],
  ['grid', 'ô lưới', '网格', 'сетка'],
  ['dots', 'chấm', '点阵', 'точки'],
  ['On', 'Bật', '开启', 'Вкл.'],
  ['Off', 'Tắt', '关闭', 'Выкл.'],
  ['Rotate', 'Xoay', '旋转', 'Повернуть'],
  ['Copy', 'Sao chép', '复制', 'Копировать'],
  ['Edit', 'Chỉnh sửa', '编辑', 'Изменить'],
  ['Properties', 'Thuộc tính', '属性', 'Свойства'],
  ['Select All', 'Chọn tất cả', '全选', 'Выбрать всё'],
  ['Undo', 'Hoàn tác', '撤销', 'Отменить'],
  ['Redo', 'Làm lại', '重做', 'Повторить'],
  ['Export', 'Xuất', '导出', 'Экспорт'],
  ['Save as PDF', 'Lưu dưới dạng PDF', '另存为 PDF', 'Сохранить как PDF'],
  ['Calculator', 'Máy tính', '计算器', 'Калькулятор'],
  ['Measure', 'Đo lường', '测量', 'Измерение'],
  ['Distance', 'Khoảng cách', '距离', 'Расстояние'],
  ['Length', 'Độ dài', '长度', 'Длина'],
  ['Area', 'Diện tích', '面积', 'Площадь'],
  ['Circumference', 'Chu vi', '周长', 'Длина окружности'],
  ['Scientific Calculator', 'Máy tính khoa học', '科学计算器', 'Инженерный калькулятор'],
  ['New Document', 'Tài liệu mới', '新建文档', 'Новый документ'],
  ['Select Starting Template', 'Chọn mẫu bắt đầu', '选择起始模板', 'Выберите шаблон'],
  ['Save Changes', 'Lưu thay đổi', '保存更改', 'Сохранить изменения'],
  ['Apply', 'Áp dụng', '应用', 'Применить'],
  ['Help', 'Trợ giúp', '帮助', 'Справка'],
  ['Language', 'Ngôn ngữ', '语言', 'Язык'],
  ['English', 'English', 'English', 'English'],
  ['Create File', 'Tạo tệp', '创建文件', 'Создать файл'],
  ['Text & Formula Editor', 'Trình chỉnh sửa văn bản & công thức', '文本与公式编辑器', 'Редактор текста и формул'],
  ['Enter text or a formula', 'Nhập văn bản hoặc công thức', '输入文本或公式', 'Введите текст или формулу'],
  ['Quick Mathematical & Geometric Symbols:', 'Ký hiệu toán học & hình học nhanh:', '常用数学与几何符号：', 'Быстрые математические и геометрические символы:'],
  ['Place on Canvas', 'Đặt lên trang vẽ', '放置到画布', 'Поместить на холст'],
  ['Euclid font · Ctrl+B / Ctrl+I / Ctrl+U', 'Phông Euclid · Ctrl+B / Ctrl+I / Ctrl+U', 'Euclid 字体 · Ctrl+B / Ctrl+I / Ctrl+U', 'Шрифт Euclid · Ctrl+B / Ctrl+I / Ctrl+U'],
  ['Label / Name', 'Nhãn / Tên', '标签 / 名称', 'Метка / Имя'],
  ['Point Style', 'Kiểu điểm', '点样式', 'Стиль точки'],
  ['Color Palette', 'Bảng màu', '调色板', 'Палитра цветов'],
  ['Custom Color:', 'Màu tùy chỉnh:', '自定义颜色：', 'Пользовательский цвет:'],
  ['Delete Object', 'Xóa đối tượng', '删除对象', 'Удалить объект'],
  ['Close Panel', 'Đóng bảng', '关闭面板', 'Закрыть панель'],
  ['Line Style', 'Kiểu đường', '线条样式', 'Стиль линии'],
  ['Fill Color', 'Màu tô', '填充颜色', 'Цвет заливки'],
  ['Properties', 'Thuộc tính', '属性', 'Свойства'],
  ['Position', 'Vị trí', '位置', 'Положение'],
  ['General', 'Chung', '常规', 'Общие'],
  ['Solid', 'Liền nét', '实线', 'Сплошная'],
  ['Dashed', 'Nét đứt', '虚线', 'Пунктирная'],
  ['Dotted', 'Chấm', '点线', 'Точечная'],
  ['Hollow', 'Rỗng', '空心', 'Пустая'],
  ['Cross', 'Dấu chéo', '叉号', 'Крест'],
  ['Scientific Calculator', 'Máy tính khoa học', '科学计算器', 'Инженерный калькулятор'],
  ['Calculator', 'Máy tính', '计算器', 'Калькулятор'],
  ['Distance / Length', 'Khoảng cách / Độ dài', '距离 / 长度', 'Расстояние / Длина'],
  ['Angle', 'Góc', '角', 'Угол'],
  ['Area', 'Diện tích', '面积', 'Площадь'],
  ['Calculate', 'Tính toán', '计算', 'Вычислить'],
  ['Result', 'Kết quả', '结果', 'Результат'],
  ['Clear', 'Xóa', '清除', 'Очистить'],
  ['Create New Document / File', 'Tạo tài liệu / tệp mới', '创建新文档 / 文件', 'Создать документ / файл'],
  ['Blank Document', 'Tài liệu trống', '空白文档', 'Пустой документ'],
  ['Clean, plain white pages for freehand notes, teaching drafts, and custom geometric drawings.', 'Trang trắng đơn giản để ghi chú tự do, soạn bài giảng và vẽ hình học.', '纯白页面，适合自由笔记、教学草稿和几何绘图。', 'Чистые белые страницы для заметок, учебных черновиков и геометрических построений.'],
  ['Standard metric coordinate grid for Euclidean geometry, coordinates, and graphing.', 'Lưới tọa độ tiêu chuẩn cho hình học Euclid và đồ thị.', '标准公制坐标网格，适用于欧几里得几何、坐标和绘图。', 'Стандартная метрическая координатная сетка для геометрии и графиков.'],
  ['Horizontal lined notebook pages for handwriting notes, proofs, and definitions.', 'Trang kẻ ngang để viết ghi chú, chứng minh và định nghĩa.', '横线笔记页，适合手写笔记、证明和定义。', 'Линованные страницы для заметок, доказательств и определений.'],
  ['Angle Settings', 'Cài đặt góc', '角度设置', 'Настройки угла'],
  ['Shading Type', 'Kiểu tô', '阴影类型', 'Тип заливки'],
  ['Solid Sector', 'Hình quạt đặc', '实心扇形', 'Сектор'],
  ['Hatched Lines', 'Đường gạch', '阴影线', 'Штриховка'],
  ['Single Arc', 'Một cung', '单弧', 'Одна дуга'],
  ['Double Arc', 'Hai cung', '双弧', 'Двойная дуга'],
  ['Right Angle ⦜', 'Góc vuông ⦜', '直角 ⦜', 'Прямой угол ⦜'],
  ['Angle Label (or degree)', 'Nhãn góc (hoặc độ)', '角度标签（或度数）', 'Метка угла (или градусы)'],
  ['Arc Size / Radius', 'Kích thước cung / Bán kính', '弧大小 / 半径', 'Размер дуги / Радиус'],
  ['Line / Arc Color', 'Màu đường / cung', '线条 / 弧线颜色', 'Цвет линии / дуги'],
  ['Fill Tint', 'Màu tô', '填充色', 'Цвет заливки'],
  ['New Document / File...', 'Tài liệu / Tệp mới...', '新建文档 / 文件...', 'Новый документ / файл...'],
  ['Open Document (.gnote)...', 'Mở tài liệu (.gnote)...', '打开文档 (.gnote)...', 'Открыть документ (.gnote)...'],
  ['Save Document (.gnote)', 'Lưu tài liệu (.gnote)', '保存文档 (.gnote)', 'Сохранить документ (.gnote)'],
  ['New Page', 'Trang mới', '新建页面', 'Новая страница'],
  ['Save as PDF', 'Lưu dưới dạng PDF', '另存为 PDF', 'Сохранить как PDF'],
  ['Eye Protection', 'Bảo vệ mắt', '护眼模式', 'Защита зрения'],
  ['Paper Pattern', 'Kiểu giấy', '纸张样式', 'Разметка бумаги'],
  ['Circumcircle (Triangle or 3 points)', 'Đường tròn ngoại tiếp (tam giác hoặc 3 điểm)', '外接圆（三角形或三点）', 'Описанная окружность (треугольник или 3 точки)'],
  ['Thebault Circle (A, B, C, then D on BC)', 'Đường tròn Thébault (A, B, C, rồi D trên BC)', 'Thébault 圆（A、B、C，然后 BC 上的 D）', 'Окружность Тебо (A, B, C, затем D на BC)'],
  ['Incircle', 'Đường tròn nội tiếp', '内切圆', 'Вписанная окружность'],
  ['Excircle', 'Đường tròn bàng tiếp', '旁切圆', 'Вневписанная окружность'],
  ["Euler's Line", 'Đường thẳng Euler', '欧拉线', 'Прямая Эйлера'],
  ["Euler's Circle (Nine-Point Circle)", 'Đường tròn Euler (đường tròn 9 điểm)', '欧拉圆（九点圆）', 'Окружность Эйлера (девяти точек)'],
  ['Mixtilinear Incircle', 'Đường tròn nội tiếp hỗn hợp', '混合内切圆', 'Микстилинейная вписанная окружность'],
  ['Mixtilinear Excircle', 'Đường tròn bàng tiếp hỗn hợp', '混合旁切圆', 'Микстилинейная вневписанная окружность'],
  ['Radical Axis of 2 Circles', 'Trục đẳng phương của 2 đường tròn', '两圆的根轴', 'Радикальная ось двух окружностей'],
  ['Geometric Construction', 'Dựng hình học', '几何作图', 'Геометрические построения'],
  ['Circle Center', 'Tâm đường tròn', '圆心', 'Центр окружности'],
  ['Arc (Center, Start, End)', 'Cung (tâm, đầu, cuối)', '圆弧（圆心、起点、终点）', 'Дуга (центр, начало, конец)'],
  ['Circumcircular Arc (A, Through B, End C)', 'Cung qua ba điểm (A, qua B, kết thúc C)', '三点圆弧（A、经过 B、终点 C）', 'Дуга через три точки (A, через B, конец C)'],
  ['Midpoint (2 Points / Segment)', 'Trung điểm (2 điểm / đoạn thẳng)', '中点（两点 / 线段）', 'Середина (2 точки / отрезок)'],
  ['Parallel Line (Point & Line)', 'Đường thẳng song song (điểm và đường thẳng)', '平行线（点和直线）', 'Параллельная прямая (точка и прямая)'],
  ['Perpendicular Line (Point & Line)', 'Đường thẳng vuông góc (điểm và đường thẳng)', '垂线（点和直线）', 'Перпендикуляр (точка и прямая)'],
  ['Tangent (Point to Circle)', 'Tiếp tuyến (điểm đến đường tròn)', '切线（点到圆）', 'Касательная (точка к окружности)'],
  ['Perpendicular Bisector', 'Đường trung trực', '垂直平分线', 'Серединный перпендикуляр'],
  ['Angle In-Bisector', 'Đường phân giác trong', '内角平分线', 'Внутренний биссектрис'],
  ['Angle Out-Bisector', 'Đường phân giác ngoài', '外角平分线', 'Внешний биссектрис'],
  ['Reflection (across Line)', 'Phép đối xứng qua đường thẳng', '关于直线对称', 'Отражение относительно прямой'],
  ['Translation of Points (by Vector)', 'Phép tịnh tiến điểm (theo vectơ)', '点平移（按向量）', 'Параллельный перенос точек (вектором)'],
  ['Rotation around Center', 'Phép quay quanh tâm', '绕中心旋转', 'Поворот вокруг центра'],
  ['Dilation (Homothety)', 'Phép vị tự', '位似变换', 'Гомотетия'],
  ['Inversion with Circle', 'Phép nghịch đảo qua đường tròn', '圆反演', 'Инверсия относительно окружности'],
  ['Polar Line of a Point', 'Đường cực của một điểm', '点的极线', 'Полярная прямая точки'],
  ['Pole of a Line', 'Cực của một đường thẳng', '直线的极点', 'Полюс прямой'],
  ['Isogonal Line in Angle', 'Đường đẳng giác trong góc', '角内等角线', 'Изогональная прямая в угле'],
  ['Isogonal Conjugate', 'Điểm liên hợp đẳng giác', '等角共轭点', 'Изогонально-сопряжённая точка'],
  ['Isotomic Conjugate', 'Điểm liên hợp đẳng tổng', '等和共轭点', 'Изотомически-сопряжённая точка'],
  ['Medicenter (Centroid)', 'Trọng tâm', '重心', 'Центроид'],
  ['Centroid', 'Trọng tâm', '重心', 'Центроид'],
  ['Circumcenter', 'Tâm đường tròn ngoại tiếp', '外心', 'Центр описанной окружности'],
  ['Orthocenter', 'Trực tâm', '垂心', 'Ортоцентр'],
  ['Incenter', 'Tâm đường tròn nội tiếp', '内心', 'Центр вписанной окружности'],
  ['Excenter', 'Tâm đường tròn bàng tiếp', '旁心', 'Вневписанный центр'],
  ['Feuerbach Point', 'Điểm Feuerbach', 'Feuerbach 点', 'Точка Фейербаха'],
  ['Lemoine Point (Symmedian)', 'Điểm Lemoine (đường đối trung)', 'Lemoine 点（对称中线）', 'Точка Лемуана (симмедиана)'],
  ['Gergonne Point', 'Điểm Gergonne', 'Gergonne 点', 'Точка Жергонна'],
  ['Nagel Point', 'Điểm Nagel', 'Nagel 点', 'Точка Нагеля'],
  ["Euler's Center (9-Point)", 'Tâm Euler (9 điểm)', '欧拉中心（九点）', 'Центр Эйлера (девяти точек)'],
  ['Ellipse: 2 Foci + 1 Point', 'Elip: 2 tiêu điểm + 1 điểm', '椭圆：两个焦点 + 一点', 'Эллипс: 2 фокуса + точка'],
  ['Conic with 5 Points', 'Đường conic qua 5 điểm', '五点圆锥曲线', 'Коника через 5 точек'],
  ['Parabola: Focus + Directrix', 'Parabol: tiêu điểm + đường chuẩn', '抛物线：焦点 + 准线', 'Парабола: фокус + директриса'],
  ['Hyperbola: 2 Foci + 1 Point', 'Hyperbol: 2 tiêu điểm + 1 điểm', '双曲线：两个焦点 + 一点', 'Гипербола: 2 фокуса + точка'],
  ['Select', 'Chọn', '选择', 'Выбор'],
  ['Active tool:', 'Công cụ đang dùng:', '当前工具：', 'Активный инструмент:'],
  ['Undo (Ctrl+Z)', 'Hoàn tác (Ctrl+Z)', '撤销 (Ctrl+Z)', 'Отменить (Ctrl+Z)'],
  ['Redo (Ctrl+Y)', 'Làm lại (Ctrl+Y)', '重做 (Ctrl+Y)', 'Повторить (Ctrl+Y)'],
  ['Point Tool', 'Công cụ điểm', '点工具', 'Инструмент точки'],
  ['Segment Tool', 'Công cụ đoạn thẳng', '线段工具', 'Инструмент отрезка'],
  ['Line Tool (Infinite Line)', 'Công cụ đường thẳng', '直线工具', 'Инструмент прямой'],
  ['Circle with Center & Point', 'Đường tròn qua tâm và một điểm', '圆心与圆上一点作圆', 'Окружность по центру и точке'],
  ['Polygon Tool', 'Công cụ đa giác', '多边形工具', 'Инструмент многоугольника'],
  ['Move & Reshape (V) - Drag points to move and update connected figures', 'Di chuyển & chỉnh hình (V) - Kéo điểm để cập nhật các hình liên kết', '移动和调整 (V) - 拖动点以移动并更新关联图形', 'Перемещение и изменение (V) — перетаскивайте точки для изменения связанных фигур'],
  ['Pen (Freehand Ink)', 'Bút (vẽ tự do)', '画笔（自由绘制）', 'Ручка (свободное рисование)'],
  ['Highlighter (Semi-transparent)', 'Bút đánh dấu (bán trong suốt)', '荧光笔（半透明）', 'Маркер (полупрозрачный)'],
  ['Hide Tool - Any objects that you click on shall disappear', 'Công cụ ẩn - Nhấn vào đối tượng để ẩn', '隐藏工具 - 点击对象以隐藏', 'Скрыть — нажмите на объект, чтобы скрыть его'],
  ['Show Tool - Select hidden objects to show them again', 'Công cụ hiện - Chọn đối tượng ẩn để hiện lại', '显示工具 - 选择隐藏对象以重新显示', 'Показать — выберите скрытый объект, чтобы показать его'],
  ['Text Tool - Add text labels or LaTeX formulas inside $...$, $$...$$, or \\[...\\]', 'Công cụ văn bản - Thêm nhãn hoặc công thức LaTeX', '文本工具 - 添加文本标签或 LaTeX 公式', 'Текст — добавление подписей или формул LaTeX'],
  ['Restore Menu Bar (Ctrl+M)', 'Khôi phục thanh menu (Ctrl+M)', '恢复菜单栏 (Ctrl+M)', 'Восстановить строку меню (Ctrl+M)'],
  ['Show Menu Bar', 'Hiện thanh menu', '显示菜单栏', 'Показать строку меню'],
  ['Close dialog', 'Đóng hộp thoại', '关闭对话框', 'Закрыть диалог'],
  ['Language', 'Ngôn ngữ', '语言', 'Язык'],
  ['Create File', 'Tạo tệp', '创建文件', 'Создать файл'],
  ['Text & Formula Editor', 'Trình chỉnh sửa văn bản & công thức', '文本与公式编辑器', 'Редактор текста и формул'],
  ['Enter text or a formula', 'Nhập văn bản hoặc công thức', '输入文本或公式', 'Введите текст или формулу'],
  ['Quick Mathematical & Geometric Symbols:', 'Ký hiệu toán học & hình học nhanh:', '常用数学与几何符号：', 'Быстрые математические и геометрические символы:'],
  ['Place on Canvas', 'Đặt lên trang vẽ', '放置到画布', 'Поместить на холст'],
  ['Label / Name', 'Nhãn / Tên', '标签 / 名称', 'Метка / Имя'],
  ['Point Style', 'Kiểu điểm', '点样式', 'Стиль точки'],
  ['Color Palette', 'Bảng màu', '调色板', 'Палитра цветов'],
  ['Custom Color:', 'Màu tùy chỉnh:', '自定义颜色：', 'Пользовательский цвет:'],
  ['Delete Object', 'Xóa đối tượng', '删除对象', 'Удалить объект'],
  ['Close Panel', 'Đóng bảng', '关闭面板', 'Закрыть панель'],
  ['Line Style', 'Kiểu đường', '线条样式', 'Стиль линии'],
  ['Fill Color', 'Màu tô', '填充颜色', 'Цвет заливки'],
  ['Position', 'Vị trí', '位置', 'Положение'],
  ['General', 'Chung', '常规', 'Общие'],
  ['Solid', 'Liền nét', '实线', 'Сплошная'],
  ['Dashed', 'Nét đứt', '虚线', 'Пунктирная'],
  ['Dotted', 'Chấm', '点线', 'Точечная'],
  ['Hollow', 'Rỗng', '空心', 'Пустая'],
  ['Cross', 'Dấu chéo', '叉号', 'Крест'],
  ['select', 'chọn', '选择', 'выбор'],
  ['pen', 'bút', '画笔', 'ручка'],
  ['highlighter', 'bút đánh dấu', '荧光笔', 'маркер'],
  ['eraser', 'tẩy', '橡皮擦', 'ластик'],
  ['hide', 'ẩn', '隐藏', 'скрыть'],
  ['unhide', 'hiện', '显示', 'показать'],
  ['Add Page', 'Thêm trang', '添加页面', 'Добавить страницу'],
  ['Visible', 'Hiện', '可见', 'Видимый'],
  ['Hidden', 'Ẩn', '隐藏', 'Скрытый'],
  ['Show (Ctrl+H)', 'Hiện (Ctrl+H)', '显示 (Ctrl+H)', 'Показать (Ctrl+H)'],
  ['Hide (Ctrl+H)', 'Ẩn (Ctrl+H)', '隐藏 (Ctrl+H)', 'Скрыть (Ctrl+H)'],
  ['Measure (cm & deg)', 'Đo lường (cm & độ)', '测量（厘米和度）', 'Измерения (см и градусы)'],
  ['Calculator with Measures', 'Máy tính với phép đo', '带测量的计算器', 'Калькулятор с измерениями'],
  ['Distance (cm)', 'Khoảng cách (cm)', '距离（厘米）', 'Расстояние (см)'],
  ['Angle (°)', 'Góc (°)', '角度（°）', 'Угол (°)'],
  ['Circumference (cm)', 'Chu vi (cm)', '周长（厘米）', 'Длина окружности (см)'],
  ['Area (cm²)', 'Diện tích (cm²)', '面积（平方厘米）', 'Площадь (см²)'],
  ['Point 1', 'Điểm 1', '点 1', 'Точка 1'],
  ['Point 2', 'Điểm 2', '点 2', 'Точка 2'],
  ['Origin (Vertex)', 'Gốc (đỉnh)', '原点（顶点）', 'Начало (вершина)'],
  ['Ray 1', 'Tia 1', '射线 1', 'Луч 1'],
  ['Ray 2', 'Tia 2', '射线 2', 'Луч 2'],
  ['Select Closed Object (Circle or Polygon)', 'Chọn hình kín (đường tròn hoặc đa giác)', '选择封闭图形（圆或多边形）', 'Выберите замкнутую фигуру (окружность или многоугольник)'],
  ['Select Closed Object (Polygon or Circle)', 'Chọn hình kín (đa giác hoặc đường tròn)', '选择封闭图形（多边形或圆）', 'Выберите замкнутую фигуру (многоугольник или окружность)'],
  ['Circles', 'Đường tròn', '圆', 'Окружности'],
  ['Polygons', 'Đa giác', '多边形', 'Многоугольники'],
  ['Point Properties', 'Thuộc tính điểm', '点属性', 'Свойства точки'],
  ['Line Properties', 'Thuộc tính đường thẳng', '直线属性', 'Свойства прямой'],
  ['Circle Properties', 'Thuộc tính đường tròn', '圆属性', 'Свойства окружности'],
  ['Polygon Properties', 'Thuộc tính đa giác', '多边形属性', 'Свойства многоугольника'],
  ['Angle Properties', 'Thuộc tính góc', '角属性', 'Свойства угла'],
  ['Conic Properties', 'Thuộc tính đường conic', '圆锥曲线属性', 'Свойства коники'],
  ['Locus Properties', 'Thuộc tính quỹ tích', '轨迹属性', 'Свойства ГМТ'],
  ['Undo', 'Hoàn tác', '撤销', 'Отменить'],
  ['Redo', 'Làm lại', '重做', 'Повторить'],
  ['File Name / Title:', 'Tên tệp / Tiêu đề:', '文件名 / 标题：', 'Имя файла / Название:'],
  ['Select Starting Template:', 'Chọn mẫu bắt đầu:', '选择起始模板：', 'Выберите шаблон:'],
  ['Close dialog', 'Đóng hộp thoại', '关闭对话框', 'Закрыть диалог'],
  ['e.g. Geometry Lesson 1', 'ví dụ: Bài học hình học 1', '例如：几何课程 1', 'например: Урок геометрии 1'],
  ['Text & Formula Editor', 'Trình chỉnh sửa văn bản & công thức', '文本与公式编辑器', 'Редактор текста и формул'],
  ['Font Size', 'Cỡ chữ', '字体大小', 'Размер шрифта'],
  ['Bold', 'Đậm', '粗体', 'Жирный'],
  ['Italic', 'Nghiêng', '斜体', 'Курсив'],
  ['Underline', 'Gạch chân', '下划线', 'Подчёркнутый'],
  ['Cancel', 'Hủy', '取消', 'Отмена'],
  ['Save', 'Lưu', '保存', 'Сохранить'],
  ['Confirm', 'Xác nhận', '确认', 'Подтвердить'],
  ['Apply', 'Áp dụng', '应用', 'Применить'],
  ['Clear', 'Xóa', '清除', 'Очистить'],
  ['Result', 'Kết quả', '结果', 'Результат'],
  ['Error', 'Lỗi', '错误', 'Ошибка'],
  ['Thickness', 'Độ dày', '粗细', 'Толщина'],
  ['Style', 'Kiểu', '样式', 'Стиль'],
  ['Measurements', 'Số đo', '测量值', 'Измерения'],
  ['Length:', 'Độ dài:', '长度：', 'Длина:'],
  ['Radius:', 'Bán kính:', '半径：', 'Радиус:'],
  ['Circumference (2πR):', 'Chu vi (2πR):', '周长（2πR）：', 'Длина окружности (2πR):'],
  ['Area (πR²):', 'Diện tích (πR²):', '面积（πR²）：', 'Площадь (πR²):'],
  ['Stroke Color', 'Màu nét vẽ', '描边颜色', 'Цвет контура'],
  ['Metrics', 'Thông số', '指标', 'Показатели'],
  ['Vertices:', 'Số đỉnh:', '顶点数：', 'Вершины:'],
  ['Locus Name', 'Tên quỹ tích', '轨迹名称', 'Название ГМТ'],
  ['Curve Color', 'Màu đường cong', '曲线颜色', 'Цвет кривой'],
  ['Visible', 'Hiện', '可见', 'Видимый'],
  ['Hidden', 'Ẩn', '隐藏', 'Скрытый'],
  ['Type:', 'Loại:', '类型：', 'Тип:'],
  ['Measure (cm & deg)', 'Đo lường (cm & độ)', '测量（厘米和度）', 'Измерения (см и градусы)'],
  ['Calculator with Measures', 'Máy tính với phép đo', '带测量的计算器', 'Калькулятор с измерениями'],
  ['Select Closed Object (Circle or Polygon)', 'Chọn hình kín (đường tròn hoặc đa giác)', '选择封闭图形（圆或多边形）', 'Выберите замкнутую фигуру (окружность или многоугольник)'],
  ['Select Closed Object (Polygon or Circle)', 'Chọn hình kín (đa giác hoặc đường tròn)', '选择封闭图形（多边形或圆）', 'Выберите замкнутую фигуру (многоугольник или окружность)'],
  ['Area (cm²)', 'Diện tích (cm²)', '面积（平方厘米）', 'Площадь (см²)'],
  ['Distance (cm)', 'Khoảng cách (cm)', '距离（厘米）', 'Расстояние (см)'],
  ['Angle (°)', 'Góc (°)', '角度（°）', 'Угол (°)'],
  ['Circumference (cm)', 'Chu vi (cm)', '周长（厘米）', 'Длина окружности (см)'],
  ['Open saved document file (.gnote / JSON)', 'Mở tài liệu đã lưu (.gnote / JSON)', '打开已保存的文档 (.gnote / JSON)', 'Открыть сохранённый документ (.gnote / JSON)'],
  ['Save active document (.gnote)', 'Lưu tài liệu hiện tại (.gnote)', '保存当前文档 (.gnote)', 'Сохранить текущий документ (.gnote)'],
  ['Rename document', 'Đổi tên tài liệu', '重命名文档', 'Переименовать документ'],
  ['Close document tab', 'Đóng thẻ tài liệu', '关闭文档标签', 'Закрыть вкладку документа'],
  ['Confirm rename', 'Xác nhận đổi tên', '确认重命名', 'Подтвердить переименование'],
  ['Open saved document file (.gnote / JSON)', 'Mở tệp tài liệu đã lưu (.gnote / JSON)', '打开已保存的文档文件 (.gnote / JSON)', 'Открыть сохранённый файл документа (.gnote / JSON)'],
  ['You can have multiple files open and switch anytime', 'Bạn có thể mở nhiều tệp và chuyển đổi bất cứ lúc nào', '可以同时打开多个文件并随时切换', 'Можно открыть несколько файлов и переключаться между ними'],
  ['Configure Default Point Size, Line Thickness, Styles, and Colors', 'Cấu hình kích thước điểm, độ dày đường, kiểu và màu mặc định', '配置默认点大小、线条粗细、样式和颜色', 'Настройка размера точек, толщины линий, стилей и цветов по умолчанию'],
  ['Text / Formula', 'Văn bản / Công thức', '文本 / 公式', 'Текст / Формула'],
  ['Add text or LaTeX math formula', 'Thêm văn bản hoặc công thức toán LaTeX', '添加文本或 LaTeX 数学公式', 'Добавить текст или математическую формулу LaTeX'],
  ['File: ', 'Tệp: ', '文件：', 'Файл: '],
  ['Create New Document / File', 'Tạo tài liệu / tệp mới', '创建新文档 / 文件', 'Создать документ / файл'],
  ['Blank', 'Trống', '空白', 'Пустой'],
  ['Grid', 'Lưới', '网格', 'Сетка'],
  ['Ruled', 'Kẻ dòng', '横线', 'Линейка'],
  ['Dots', 'Chấm', '点阵', 'Точки'],
  ['Text / Formula Editor', 'Trình chỉnh sửa văn bản / công thức', '文本 / 公式编辑器', 'Редактор текста / формул'],
  ['Text Tool', 'Công cụ văn bản', '文本工具', 'Текстовый инструмент'],
  ['Point Size', 'Kích thước điểm', '点大小', 'Размер точки'],
  ['Default Drawing Preferences', 'Tùy chọn vẽ mặc định', '默认绘图偏好设置', 'Настройки рисования по умолчанию'],
  ['Measurements', 'Số đo', '测量值', 'Измерения'],
  ['Area:', 'Diện tích:', '面积：', 'Площадь:'],
  ['Radius', 'Bán kính', '半径', 'Радиус'],
  ['Circumference', 'Chu vi', '周长', 'Длина окружности'],
  ['Diameter', 'Đường kính', '直径', 'Диаметр'],
  ['Fill', 'Tô màu', '填充', 'Заливка'],
  ['Opacity', 'Độ mờ', '不透明度', 'Непрозрачность'],
  ['Angle:', 'Góc:', '角度：', 'Угол:'],
  ['Color:', 'Màu:', '颜色：', 'Цвет:'],
  ['Template', 'Mẫu', '模板', 'Шаблон'],
  ['File Name', 'Tên tệp', '文件名', 'Имя файла'],
  ['Create', 'Tạo', '创建', 'Создать'],
  ['Download', 'Tải xuống', '下载', 'Скачать'],
  ['Export PDF', 'Xuất PDF', '导出 PDF', 'Экспорт PDF'],
  ['Page Size', 'Kích thước trang', '页面大小', 'Размер страницы'],
  ['Language Preference', 'Tùy chọn ngôn ngữ', '语言偏好设置', 'Настройки языка'],
  ['Close LaTeX dialog', 'Đóng hộp thoại LaTeX', '关闭 LaTeX 对话框', 'Закрыть окно LaTeX'],
  ['Formula Color', 'Màu công thức', '公式颜色', 'Цвет формулы'],
  ['Fraction', 'Phân số', '分数', 'Дробь'],
  ['Square Root', 'Căn bậc hai', '平方根', 'Квадратный корень'],
  ['n-th Root', 'Căn bậc n', 'n 次根', 'Корень n-й степени'],
  ['Triangle', 'Tam giác', '三角形', 'Треугольник'],
  ['Perpendicular', 'Vuông góc', '垂直', 'Перпендикуляр'],
  ['Parallel', 'Song song', '平行', 'Параллельно'],
  ['Vector', 'Vectơ', '向量', 'Вектор'],
  ['Alpha', 'Alpha', '阿尔法', 'Альфа'],
  ['Beta', 'Beta', '贝塔', 'Бета'],
  ['Theta', 'Theta', '西塔', 'Тета'],
  ['Pi', 'Pi', '圆周率', 'Пи'],
  ['Ellipse Eq', 'Phương trình elip', '椭圆方程', 'Уравнение эллипса'],
  ['Hyperbola Eq', 'Phương trình hyperbol', '双曲线方程', 'Уравнение гиперболы'],
  ['Parabola Eq', 'Phương trình parabol', '抛物线方程', 'Уравнение параболы'],
  ['Incircle Radius', 'Bán kính đường tròn nội tiếp', '内切圆半径', 'Радиус вписанной окружности'],
  ['Circumcircle Radius', 'Bán kính đường tròn ngoại tiếp', '外接圆半径', 'Радиус описанной окружности'],
  ['Euler Line', 'Đường thẳng Euler', '欧拉线', 'Прямая Эйлера'],
  ['Radical Axis', 'Trục đẳng phương', '根轴', 'Радикальная ось'],
  ['Ray', 'Tia', '射线', 'Луч'],
  ['Arc (Center, Start, End)', 'Cung (tâm, đầu, cuối)', '圆弧（圆心、起点、终点）', 'Дуга (центр, начало, конец)'],
  ['Circumcircular Arc (A, Through B, End C)', 'Cung qua ba điểm (A, qua B, kết thúc C)', '三点圆弧（A、经过 B、终点 C）', 'Дуга через три точки (A, через B, конец C)'],
  ['Perpendicular Line (Point & Line)', 'Đường thẳng vuông góc (điểm và đường thẳng)', '垂线（点和直线）', 'Перпендикуляр (точка и прямая)'],
  ['Parallel Line (Point & Line)', 'Đường thẳng song song (điểm và đường thẳng)', '平行线（点和直线）', 'Параллельная прямая (точка и прямая)'],
  ['Midpoint (2 Points / Segment)', 'Trung điểm (2 điểm / đoạn thẳng)', '中点（两点 / 线段）', 'Середина (2 точки / отрезок)'],
  ['Tangent (Point to Circle)', 'Tiếp tuyến (điểm đến đường tròn)', '切线（点到圆）', 'Касательная (точка к окружности)'],
  ['Circle through 3 Points', 'Đường tròn qua 3 điểm', '三点圆', 'Окружность через 3 точки'],
  ['Inversion', 'Phép nghịch đảo', '反演', 'Инверсия'],
  ['Point selected! Click the Inversion Circle', 'Đã chọn điểm! Nhấn vào đường tròn nghịch đảo', '已选择点！点击反演圆', 'Точка выбрана! Нажмите на окружность инверсии'],
  ['Line selected! Click the Inversion Circle', 'Đã chọn đường thẳng! Nhấn vào đường tròn nghịch đảo', '已选择直线！点击反演圆', 'Прямая выбрана! Нажмите на окружность инверсии'],
  ['Inversion Circle selected! Click a point, line, or circle to invert', 'Đã chọn đường tròn nghịch đảo! Nhấn vào điểm, đường thẳng hoặc đường tròn để nghịch đảo', '已选择反演圆！点击点、直线或圆进行反演', 'Окружность инверсии выбрана! Нажмите на точку, прямую или окружность'],
  ['Inversion: Click the Inversion Circle (or select point/line/circle first)', 'Nghịch đảo: Nhấn vào đường tròn nghịch đảo (hoặc chọn điểm/đường thẳng/đường tròn trước)', '反演：点击反演圆（或先选择点/直线/圆）', 'Инверсия: нажмите на окружность инверсии (или сначала выберите точку/прямую/окружность)'],
  ['Isogonal Line: Click Vertex A (Step 1/4)', 'Đường đẳng giác: Nhấn vào đỉnh A (Bước 1/4)', '等角线：点击顶点 A（第 1/4 步）', 'Изогональная прямая: нажмите вершину A (шаг 1/4)'],
  ['Isogonal Line: Click Point B on side AB (Step 2/4)', 'Đường đẳng giác: Nhấn vào điểm B trên cạnh AB (Bước 2/4)', '等角线：点击边 AB 上的点 B（第 2/4 步）', 'Изогональная прямая: нажмите точку B на стороне AB (шаг 2/4)'],
  ['Isogonal Line: Click Point C on side AC (Step 3/4)', 'Đường đẳng giác: Nhấn vào điểm C trên cạnh AC (Bước 3/4)', '等角线：点击边 AC 上的点 C（第 3/4 步）', 'Изогональная прямая: нажмите точку C на стороне AC (шаг 3/4)'],
  ['Isogonal Line: Click Point P on ray AP to reflect (Step 4/4)', 'Đường đẳng giác: Nhấn vào điểm P trên tia AP để phản xạ (Bước 4/4)', '等角线：点击射线 AP 上的点 P 进行反射（第 4/4 步）', 'Изогональная прямая: нажмите точку P на луче AP для отражения (шаг 4/4)'],
  ['Triangle Center: Select vertices A, B, C', 'Tâm tam giác: Chọn các đỉnh A, B, C', '三角形中心：选择顶点 A、B、C', 'Центр треугольника: выберите вершины A, B, C'],
  ['Esc to reset', 'Nhấn Esc để đặt lại', '按 Esc 重置', 'Нажмите Esc для сброса'],
  ['Ellipse', 'Elip', '椭圆', 'Эллипс'],
  ['Hyperbola', 'Hyperbol', '双曲线', 'Гипербола'],
  ['Parabola', 'Parabol', '抛物线', 'Парабола'],
  ['Text', 'Văn bản', '文本', 'Текст'],
  ['Close LaTeX dialog', 'Đóng hộp thoại LaTeX', '关闭 LaTeX 对话框', 'Закрыть окно LaTeX'],
];

const catalog = Object.fromEntries(
  LANGUAGES.filter(({ code }) => code !== 'en').map(({ code }) => {
    const column = code === 'vi' ? 0 : code === 'zh' ? 1 : 2;
    return [code, Object.fromEntries(entries.map(([english, ...translations]) => [english, translations[column]]))];
  })
) as Record<Exclude<LanguageCode, 'en'>, Record<string, string>>;

const languageName: Record<LanguageCode, string> = {
  vi: 'vi',
  en: 'en',
  zh: 'zh-CN',
  ru: 'ru',
};

const toolLabels: Record<string, string> = {
  select: 'Select',
  pen: 'Pen',
  highlighter: 'Highlighter',
  eraser: 'Eraser',
  hide: 'Hide',
  unhide: 'Show',
  latex: 'Text',
  point: 'Point',
  'circle-center': 'Circle Center',
  line: 'Line',
  segment: 'Segment',
  ray: 'Ray',
  'circle-center-point': 'Circle',
  'circle-3points': 'Circle through 3 Points',
  'circular-arc': 'Arc (Center, Start, End)',
  'circumcircular-arc': 'Circumcircular Arc (A, Through B, End C)',
  polygon: 'Polygon',
  'angle-shading': 'Angle',
  angle: 'Angle',
  'perpendicular-bisector': 'Perpendicular Bisector',
  'perpendicular-line': 'Perpendicular Line (Point & Line)',
  'parallel-line': 'Parallel Line (Point & Line)',
  midpoint: 'Midpoint (2 Points / Segment)',
  tangent: 'Tangent (Point to Circle)',
  'angle-bisector-in': 'Angle In-Bisector',
  'angle-bisector-out': 'Angle Out-Bisector',
  intersect: 'Intersect',
  locus: 'Locus',
  circumcircle: 'Circumcircle (Triangle or 3 points)',
  incircle: 'Incircle',
  excircle: 'Excircle',
  'euler-line': "Euler's Line",
  'euler-circle': "Euler's Circle (Nine-Point Circle)",
  'mixtilinear-incircle': 'Mixtilinear Incircle',
  'mixtilinear-excircle': 'Mixtilinear Excircle',
  'thebault-circle': 'Thebault Circle (A, B, C, then D on BC)',
  'radical-axis': 'Radical Axis',
  'translate-vector': 'Translation of Points (by Vector)',
  rotation: 'Rotation around Center',
  reflection: 'Reflection (across Line)',
  'inversion-circle': 'Inversion with Circle',
  'polar-line': 'Polar Line of a Point',
  'pole-line': 'Pole of a Line',
  'isogonal-line': 'Isogonal Line in Angle',
  'isogonal-conjugate': 'Isogonal Conjugate',
  'isotomic-conjugate': 'Isotomic Conjugate',
  dilation: 'Dilation (Homothety)',
  'center-centroid': 'Centroid',
  'center-circumcenter': 'Circumcenter',
  'center-orthocenter': 'Orthocenter',
  'center-incenter': 'Incenter',
  'center-excenter': 'Excenter',
  'center-lemoine': 'Lemoine Point (Symmedian)',
  'center-gergonne': 'Gergonne Point',
  'center-nagel': 'Nagel Point',
  'center-euler': "Euler's Center (9-Point)",
  'center-feuerbach': 'Feuerbach Point',
  'center-humpty': 'A-Humpty Point',
  'center-dumpty': 'A-Dumpty Point',
  'conic-ellipse-5pt': 'Conic with 5 Points',
  'conic-5pt': 'Conic with 5 Points',
  'conic-ellipse-2foci-1pt': 'Ellipse: 2 Foci + 1 Point',
  'conic-parabola-focus-directrix': 'Parabola: Focus + Directrix',
  'conic-parabola-5pt': 'Parabola: Focus + Directrix',
  'conic-hyperbola-2foci-1pt': 'Hyperbola: 2 Foci + 1 Point',
  'conic-hyperbola-5pt': 'Hyperbola: 2 Foci + 1 Point',
};

function translateMessage(source: string, language: LanguageCode): string | undefined {
  if (language === 'en') return source;
  const messages = catalog[language];
  const normalized = source.trim().replace(/\s+/g, ' ');
  const exact = messages[normalized];
  if (exact) return exact;
  if (normalized === 'Pages (') {
    return language === 'vi' ? 'Trang (' : language === 'zh' ? '页面（' : 'Страницы (';
  }
  const activeTool = normalized.match(/^Active tool: (.+)$/);
  if (activeTool) {
    const toolName = activeTool[1].toLowerCase();
    const toolId = toolName.replace(/ /g, '-');
    const translatedTool = messages[toolLabels[toolId] ?? toolLabels[toolName] ?? toolName];
    if (translatedTool) {
      const prefix = language === 'vi' ? 'Công cụ đang dùng' : language === 'zh' ? '当前工具' : 'Активный инструмент';
      return `${prefix}: ${translatedTool}`;
    }
  }
  const rotation = normalized.match(/^Rotation \((.+)°\): Click (point to rotate|center point) \(Step ([12])\/2\)$/);
  if (rotation) {
    const step = rotation[3] === '1' ? '1/2' : '2/2';
    const action = language === 'vi'
      ? (rotation[3] === '1' ? 'Nhấn vào điểm để xoay' : 'Nhấn vào điểm tâm')
      : language === 'zh'
        ? (rotation[3] === '1' ? '点击要旋转的点' : '点击中心点')
        : (rotation[3] === '1' ? 'Нажмите точку для поворота' : 'Нажмите центральную точку');
    const label = language === 'vi' ? 'Phép quay' : language === 'zh' ? '旋转' : 'Поворот';
    return `${label} (${rotation[1]}°): ${action} (${language === 'vi' ? 'Bước' : language === 'zh' ? '第' : 'шаг'} ${step})`;
  }
  const fontSize = normalized.match(/^Font Size \((\d+(?:\.\d+)?)px\)$/);
  if (fontSize) {
    const label = language === 'vi' ? 'Cỡ chữ' : language === 'zh' ? '字体大小' : 'Размер шрифта';
    return `${label} (${fontSize[1]}px)`;
  }
  const triangleCenter = normalized.match(/^Triangle Center: Select vertices A, B, C \((\d+)\/3\)$/);
  if (triangleCenter) {
    const translated = messages['Triangle Center: Select vertices A, B, C'];
    return `${translated} (${triangleCenter[1]}/3)`;
  }
  const propertyTitle = normalized.match(/^(Point|Line|Circle|Polygon|Angle|Conic|Locus) Properties$/i);
  if (propertyTitle) {
    const kind = messages[propertyTitle[1].toLowerCase().replace(/^./, (character) => character.toUpperCase())];
    const suffix = language === 'vi' ? 'Thuộc tính' : language === 'zh' ? '属性' : 'Свойства';
    const translatedKind = kind?.toLocaleLowerCase(languageName[language]) ?? propertyTitle[1];
    return language === 'zh' ? `${translatedKind}${suffix}` : `${suffix} ${translatedKind}`;
  }
  if (/^Page \d+(?: \/ \d+)?$/.test(normalized)) {
    return normalized.replace(/^Page /, `${language === 'vi' ? 'Trang' : language === 'zh' ? '页面' : 'Страница'} `);
  }
  if (/^Pages \(\d+\)$/.test(normalized)) {
    return normalized.replace(/^Pages /, `${language === 'vi' ? 'Trang' : language === 'zh' ? '页面' : 'Страницы'} `);
  }
  const jumpPage = normalized.match(/^Jump to Page (\d+)$/);
  if (jumpPage) {
    const prefix = language === 'vi' ? 'Đi tới trang' : language === 'zh' ? '跳转到页面' : 'Перейти к странице';
    return `${prefix} ${jumpPage[1]}`;
  }
  return undefined;
}

interface TranslationRecord {
  source: string;
  rendered: string;
}

const textRecords = new WeakMap<Text, TranslationRecord>();
const attributeRecords = new WeakMap<Element, Map<string, TranslationRecord>>();

function getSource(current: string, record: TranslationRecord | undefined): string {
  return record && current === record.rendered ? record.source : current;
}

function localizeTextNode(node: Text, language: LanguageCode) {
  const current = node.nodeValue;
  if (current === null) return;
  const source = getSource(current, textRecords.get(node));
  const normalized = source.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    textRecords.set(node, { source, rendered: source });
    return;
  }
  const translated = translateMessage(source, language);
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  const rendered = translated ? `${leading}${translated}${trailing}` : source;
  textRecords.set(node, { source, rendered });
  if (node.nodeValue !== rendered) node.nodeValue = rendered;
}

function localizeAttributes(element: Element, language: LanguageCode) {
  const records = attributeRecords.get(element) ?? new Map<string, TranslationRecord>();
  for (const name of ['title', 'aria-label', 'aria-description', 'placeholder']) {
    const current = element.getAttribute(name);
    if (current === null) continue;
    const source = getSource(current, records.get(name));
    const translated = translateMessage(source, language);
    const rendered = translated ?? source;
    records.set(name, { source, rendered });
    if (current !== rendered) element.setAttribute(name, rendered);
  }
  attributeRecords.set(element, records);
}

function localizeTree(node: Node, language: LanguageCode) {
  if (node.nodeType === Node.TEXT_NODE) {
    if ((node as Text).parentElement?.closest('[data-no-translate]')) return;
    localizeTextNode(node as Text, language);
    return;
  }
  if (!(node instanceof Element)) return;
  if (node.closest('[data-no-translate]')) return;
  localizeAttributes(node, language);
  node.childNodes.forEach((child) => localizeTree(child, language));
}

const LanguageContext = createContext<{
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
} | null>(null);

export function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = window.localStorage.getItem('geonote-language');
    return LANGUAGES.some((item) => item.code === saved) ? (saved as LanguageCode) : 'en';
  });
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    document.documentElement.lang = languageName[language];
    window.localStorage.setItem('geonote-language', language);
    localizeTree(document.body, language);
  }, [language]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          localizeTextNode(mutation.target as Text, languageRef.current);
        } else if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          localizeAttributes(mutation.target, languageRef.current);
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => localizeTree(node, languageRef.current));
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label', 'aria-description', 'placeholder'],
    });
    localizeTree(document.body, languageRef.current);
    return () => observer.disconnect();
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useAppLanguage must be used within LanguageProvider');
  return value;
}
