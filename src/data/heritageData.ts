import { Region, Province, Place, CulturalArticle, Journey, CategoryInfo } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'di-tich-lich-su',
    name: 'Di Tích Lịch Sử',
    description: 'Địa điểm ghi dấu sự kiện, nhân vật và biến thiên lịch sử',
    color: '#B8322A',
    iconName: 'Landmark',
  },
  {
    id: 'di-san-phi-vat-the',
    name: 'Di Sản Phi Vật Thể',
    description: 'Lễ hội, nghệ thuật trình diễn, tri thức dân gian truyền khẩu',
    color: '#D8A84E',
    iconName: 'Sparkles',
  },
  {
    id: 'di-tich-kien-truc',
    name: 'Chùa, Đình & Kiến Trúc Cổ',
    description: 'Không gian tâm linh, nhà cổ Nam Bộ và công trình giao thoa Đông - Tây',
    color: '#795548',
    iconName: 'Building2',
  },
  {
    id: 'khao-co',
    name: 'Khảo Cổ & Di Chỉ Cổ',
    description: 'Dấu tích văn minh tiền sử và di chỉ cổ phương Nam',
    color: '#354C68',
    iconName: 'Compass',
  },
  {
    id: 'lang-nghe',
    name: 'Làng Nghề Truyền Thống',
    description: 'Nghề thủ công gốm sứ, sơn mài, đúc đồng lưu truyền qua nhiều thế hệ',
    color: '#397C73',
    iconName: 'Hammer',
  },
  {
    id: 'am-thuc-dan-gian',
    name: 'Ẩm Thực Dân Gian',
    description: 'Món ăn truyền thống gắn liền với tập quán và thổ nhưỡng địa phương',
    color: '#D8A84E',
    iconName: 'Utensils',
  },
];

export const REGIONS: Region[] = [
  {
    id: 'dong-nam-bo',
    name: 'Đông Nam Bộ',
    code: 'dong-nam-bo',
    description: 'Vùng đất mở cõi phương Nam với lịch sử hơn 300 năm hình thành Gia Định - Sài Gòn, Đồng Nai, Tây Ninh kiên trung.',
  },
];

export const PROVINCES: Province[] = [
  {
    id: 'tp-ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    historical_names: ['Sài Gòn', 'Gia Định', 'Bến Nghé'],
    region_id: 'dong-nam-bo',
    center_coords: [10.776, 106.7],
    summary: 'Đô thị di sản hơn 320 năm tuổi, nơi giao thoa văn hóa thương cảng quốc tế và lịch sử cách mạng.',
  },
  {
    id: 'dong-nai',
    name: 'Đồng Nai',
    historical_names: ['Biên Hòa', 'Trấn Biên'],
    region_id: 'dong-nam-bo',
    center_coords: [10.957, 106.824],
    summary: 'Nơi khởi nguồn khai phá xứ Đàng Trong năm 1698 với làng gốm men xanh Biên Hòa nức tiếng.',
  },
  {
    id: 'tay-ninh',
    name: 'Tây Ninh',
    historical_names: ['Tây Ninh Phủ', 'Vùng Đất Thánh'],
    region_id: 'dong-nam-bo',
    center_coords: [11.31, 106.098],
    summary: 'Đất thánh Tòa Thánh Tây Ninh đạo Cao Đài, di sản Bánh tráng phơi sương và đỉnh Núi Bà Đen.',
  },
];

export const PLACES: Place[] = [
  {
    id: 'lang-gom-bien-hoa',
    slug: 'lang-gom-bien-hoa',
    name: 'Làng Gốm Biên Hòa & Tân Vạn',
    alternative_names: ['Gốm mỹ nghệ Đồng Nai', 'Gốm Cây Mai kế thừa'],
    province_id: 'dong-nai',
    province_name: 'Đồng Nai',
    region_id: 'dong-nam-bo',
    category_id: 'lang-nghe',
    coordinates: { lat: 10.9572, lng: 106.8241 },
    address: 'Phường Bửu Long, Hóa An và Tân Vạn, TP. Biên Hòa, Tỉnh Đồng Nai',
    short_description: 'Cái nôi gốm men xanh trứ danh phương Nam với lịch sử hơn 300 năm hình thành bên sông Đồng Nai.',
    historical_background:
      'Khởi nguồn từ những di dân thợ gốm người Hoa và người Việt cuối thế kỷ 17. Đến năm 1903, Trường Mỹ nghệ Biên Hòa được thành lập, tạo nên bước ngoặt đưa gốm mỹ nghệ Biên Hòa đoạt nhiều huy chương vàng quốc tế tại Paris (1925).',
    cultural_significance:
      'Men xanh đồng trổ bông (men trổ đồng) là màu men độc quyền không thể nhầm lẫn của gốm Biên Hòa. Tác phẩm gốm phản ánh đời sống sông nước, hoa cỏ, chim muông đậm tính dân tộc.',
    architecture_features:
      'Hệ thống lò rồng, lò bầu truyền thống trải dài dọc mép bờ sông Đồng Nai, dùng đất sét và củi đước nung tạo độ bóng tự nhiên.',
    ethnic_context: 'Sự hòa quyện kỹ thuật của thợ gốm người Việt và thợ gốm người Hoa',
    visitor_info: {
      opening_hours: '08:00 - 17:00 các ngày làm việc (các xưởng gốm Tân Vạn & Bửu Long)',
      fee: 'Tham quan tự do tại các cơ sở mở cửa đón khách',
      etiquette: 'Chú ý an toàn khi đi lại gần khu vực lò nung gốm nhiệt độ cao',
      contact: 'Hiệp hội Gốm mỹ nghệ Đồng Nai',
      verified_source: 'Sở Văn hóa Thể thao và Du lịch tỉnh Đồng Nai',
    },
    verification_status: 'verified',
    featured: true,
    media: [
      {
        id: 'gombienhoa-1',
        image_url: '/assets/heritage/gom-bien-hoa.jpg',
        source_url: 'https://commons.wikimedia.org/wiki/File:Lamp,_Bien_Hoa_ceramic,_green_glaze_-_Nguyen_dynasty,_19th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi,_Vietnam_-_DSC05301.JPG',
        source_name: 'Wikimedia Commons',
        photographer: 'Daderot',
        license_type: 'Public Domain',
        license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
        attribution_text: 'Daderot / Wikimedia Commons (CC0)',
        caption: 'Đèn gốm Biên Hòa men xanh thời Nguyễn, thế kỷ 19',
        date_taken: '2014',
        verification_status: 'verified',
      },
    ],
    stats: {
      savedCount: 210,
      visitedCount: 142,
      reviewCount: 25,
      rating: 4.7,
    },
  },
  {
    id: 'toa-thanh-tay-ninh',
    slug: 'toa-thanh-tay-ninh',
    name: 'Tòa Thánh Tây Ninh',
    alternative_names: ['Đền Thánh Tây Ninh', 'Tổ đình Cao Đài'],
    province_id: 'tay-ninh',
    province_name: 'Tây Ninh',
    region_id: 'dong-nam-bo',
    category_id: 'di-tich-kien-truc',
    coordinates: { lat: 11.3095, lng: 106.1362 },
    address: 'Phường Long Hoa, Thị xã Hòa Thành, Tỉnh Tây Ninh',
    short_description: 'Công trình kiến trúc tôn giáo độc bản thế giới, cái nôi của đạo Cao Đài kết hợp tinh hoa Đông - Tây.',
    historical_background:
      'Khởi công năm 1931 và khánh thành năm 1955. Tòa Thánh được xây dựng hoàn toàn bằng sức lao động và sự hiến dâng của các tín đồ Cao Đài mà không sử dụng bản vẽ kiến trúc sư phương Tây.',
    cultural_significance:
      'Biểu tượng của tư tưởng Tam giáo đồng nguyên (Phật - Lão - Nho) kết hợp triết lý vũ trụ quan Đại Đạo Tam Kỳ Phổ Độ.',
    architecture_features:
      'Hai tháp chuông trống Hiệp Thiên Đài cao vút, Cửu Trùng Đài có 9 bậc cấp tượng trưng 9 phẩm vị, trần nhà vẽ bầu trời đêm đầy sao và Thiên Nhãn linh thiêng.',
    ethnic_context: 'Cộng đồng tín đồ đạo Cao Đài phương Nam',
    visitor_info: {
      opening_hours: 'Mở cửa tham quan ban ngày; các buổi cúng lễ lớn diễn ra lúc 06:00, 12:00, 18:00 và 24:00',
      fee: 'Miễn phí vào cửa',
      etiquette: 'Tháo giày dép bên ngoài, nam đi cửa bên phải, nữ đi cửa bên trái, mặc trang phục lịch sự không hở vai/đùi',
      contact: 'Hội Thánh Cao Đài Tòa Thánh Tây Ninh',
      verified_source: 'Văn phòng Hội Thánh Cao Đài Tây Ninh',
    },
    verification_status: 'verified',
    featured: true,
    media: [
      {
        id: 'toathanhtayninh-1',
        image_url: '/assets/heritage/toa-thanh-tay-ninh.jpg',
        source_url: 'https://commons.wikimedia.org/wiki/File:Cao_Dai_Holy_See,_Tay_Ninh.jpg',
        source_name: 'Wikimedia Commons',
        photographer: 'Mussi Katz',
        license_type: 'Public Domain',
        license_url: 'https://creativecommons.org/publicdomain/mark/1.0/',
        attribution_text: 'Mussi Katz / Wikimedia Commons (Public Domain)',
        caption: 'Mặt tiền rực rỡ sắc màu triết học của Tòa Thánh Tây Ninh',
        date_taken: '2017',
        verification_status: 'verified',
      },
    ],
    stats: {
      savedCount: 380,
      visitedCount: 260,
      reviewCount: 51,
      rating: 4.9,
    },
  },
];

export const ARTICLES: CulturalArticle[] = [
  {
    id: 'nghe-thuat-don-ca-tai-tu',
    slug: 'nghe-thuat-don-ca-tai-tu',
    title: 'Đờn Ca Tài Tử Nam Bộ: Hồn Phách Âm Nhạc Miệt Vườn',
    subtitle: 'Di sản văn hóa phi vật thể đại diện của nhân loại được UNESCO vinh danh',
    topic: 'Âm nhạc & Di sản',
    ethnic_community: 'Cộng đồng cư dân Nam Bộ',
    region_name: 'Đông Nam Bộ & Nam Bộ',
    read_time: '7 phút',
    published_date: '2026-03-12',
    author: 'TS. Nguyễn Văn Hầu',
    author_title: 'Viện Nghiên cứu Văn hóa Dân gian Phương Nam',
    excerpt:
      'Đờn ca tài tử không chỉ là một dòng nhạc mà là lối sống, là nhịp thở tâm hồn của người phương Nam sau những giờ lao động vất vả.',
    sections: [
      {
        heading: 'Nguồn gốc và sự hình thành nơi đất mới',
        body: 'Đờn ca tài tử Nam Bộ ra đời vào cuối thế kỷ 19, bắt nguồn từ nhạc lễ cung đình Huế kết hợp với điệu hò, điệu lý dân gian mộc mạc của vùng đất phương Nam. Khác với nghệ thuật biểu diễn trên sân khấu lớn, chữ "tài tử" ở đây mang hàm nghĩa người chơi đờn, ca hát vì niềm đam mê nghệ thuật chứ không coi đó là nghề mưu sinh kiếm sống.',
      },
      {
        heading: 'Hệ thống ngũ cung và các nhạc cụ cốt lõi',
        body: 'Âm nhạc tài tử sử dụng thang âm ngũ cung đặc thù của phương Nam: Hò - Xự - Xang - Xê - Cống, với các hơi điệu như hơi Bắc (vui tươi, trang nhã), hơi Nam (buồn, sâu lắng, hoài niệm), hơi Oán (bi thương, dạt dào nỗi niềm trắc ẩn). Dàn nhạc thường có đờn kìm (nguyệt), đờn tranh, đờn cò (nhị), đờn bầu và sau này có thêm đờn ghita phím lõm độc đáo.',
        quote: '"Cung thương gảy khúc tang bồng / Gió lộng sông quê ấm nồng tiếng tơ."',
      },
      {
        heading: 'Giá trị sống hôm nay',
        body: 'Năm 2013, UNESCO chính thức ghi danh Nghệ thuật Đờn ca tài tử Nam Bộ vào danh sách Di sản văn hóa phi vật thể đại diện của nhân loại. Đến nay, các câu lạc bộ tài tử vẫn tụ họp cất lên tiếng đờn sưởi ấm tâm hồn bao thế hệ.',
      },
    ],
    source_citations: [
      {
        source_name: 'Hồ sơ đệ trình UNESCO công nhận Đờn ca tài tử Nam Bộ (Cục Di sản Văn hóa, 2013)',
        type: 'văn bản di sản',
        verified: true,
      },
      {
        source_name: 'GS.TS Trần Văn Khê - "Âm nhạc truyền thống Việt Nam", NXB Trẻ, 2001',
        type: 'sách',
        verified: true,
      },
    ],
    tags: ['Đờn ca tài tử', 'UNESCO', 'Nam Bộ', 'Âm nhạc truyền thống'],
    cover_image: {
      id: 'art-doncataitu',
      image_url: '/assets/heritage/don-ca-tai-tu.jpg',
      source_url: 'https://commons.wikimedia.org/wiki/File:Traditional_Vietnamese_Music.jpg',
      source_name: 'Wikimedia Commons',
      photographer: 'Eustaquio Santimano',
      license_type: 'CC BY 2.0',
      license_url: 'https://creativecommons.org/licenses/by/2.0/',
      attribution_text: 'Eustaquio Santimano / Wikimedia Commons (CC BY 2.0)',
      caption: 'Buổi biểu diễn nhạc cụ truyền thống Việt Nam tại Bảo tàng Lịch sử',
      verification_status: 'verified',
    },
  },
];

export const JOURNEYS: Journey[] = [
  {
    id: 'tinh-hoa-lang-nghe-dong-nam-bo',
    slug: 'tinh-hoa-lang-nghe-dong-nam-bo',
    title: 'Men Gốm & Đất Thánh: Di Sản Đông Nam Bộ',
    subtitle: 'Từ đất nung Biên Hòa đến đỉnh thiêng Tòa Thánh Tây Ninh',
    description:
      'Khám phá kỹ nghệ làm gốm men xanh trổ đồng trứ danh hơn 3 thế kỷ bên sông Đồng Nai và chiêm ngưỡng công trình kiến trúc tôn giáo độc nhất vô nhị tại Tòa Thánh Tây Ninh.',
    curator: 'Ban Di Sản Đông Nam Bộ',
    cover_image: '/assets/heritage/toa-thanh-tay-ninh.jpg',
    places: ['lang-gom-bien-hoa', 'toa-thanh-tay-ninh'],
    tags: ['Làng nghề', 'Gốm Biên Hòa', 'Đạo Cao Đài', 'Đông Nam Bộ'],
    estimated_duration: '2 ngày 1 đêm',
    cultural_theme: 'Thủ công truyền thống & Kiến trúc tôn giáo',
    is_official: true,
  },
];