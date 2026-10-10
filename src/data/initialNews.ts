import { NewsArticle } from '../types/news';
import makassarSunriseImg from '../assets/images/makassar_losari_sunrise_1790718488757.jpg';
import torajaCoffeeImg from '../assets/images/toraja_coffee_harvest_1790718503509.jpg';
import rammangRiverImg from '../assets/images/rammang_karst_river_1790718515940.jpg';
import sengkangSilkImg from '../assets/images/sengkang_silk_weaving_1790718528347.jpg';
import cotoMakassarImg from '../assets/images/culinary_coto_makassar_1790718548139.jpg';

export const CURATED_PHOTO_PRESETS = [
  {
    label: 'Layar Phinisi di Pesisir Losari',
    url: makassarSunriseImg,
    defaultCaption: 'Kapal kayu Phinisi berlabuh saat matahari terbit di perairan Makassar, Sulawesi Selatan.'
  },
  {
    label: 'Panen Kopi Arabika Pegunungan Toraja',
    url: torajaCoffeeImg,
    defaultCaption: 'Petani memanen buah kopi merah matang di lereng berkabut Tana Toraja pada ketinggian 1.600 mdpl.'
  },
  {
    label: 'Menyusuri Sungai Karst Rammang-Rammang',
    url: rammangRiverImg,
    defaultCaption: 'Perahu kayu warga melintasi alur Sungai Pute di antara tebing batu kapur purba Rammang-Rammang, Maros.'
  },
  {
    label: 'Tenun Sutra Lipa Sabbe Sengkang',
    url: sengkangSilkImg,
    defaultCaption: 'Pengrajin menenun helaian benang sutra hijau zamrud dan emas menggunakan alat tenun tradisional di Wajo.'
  },
  {
    label: 'Warisan Kuliner Rempah Makassar',
    url: cotoMakassarImg,
    defaultCaption: 'Sajian kuliner berkuah rempah khas Sulawesi Selatan dalam mangkuk tanah liat bersama ketupat daun pandan.'
  }
];

export const INITIAL_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'kareba-01',
    title: 'Kebangkitan Armada Phinisi Ramah Lingkungan di Pelabuhan Paotere Makassar',
    summary:
      'Para pembuat perahu tradisional Bulukumba dan pelaut Makassar mulai mengintegrasikan panel tenaga surya hibrida pada kapal kayu Phinisi tanpa mengubah pakem konstruksi warisan leluhur.',
    content: [
      'Di sepanjang dermaga Pelabuhan Rakyat Paotere, deretan tiang layar kapal kayu Phinisi menjulang membelah cahaya keemasan pagi Makassar. Namun jika diperhatikan lebih dekat, ada pembaruan senyap yang sedang berlangsung di geladak beberapa kapal kargo antar-pulau tersebut: modul surya maritim dan motor propulsi bantu rendah emisi.',
      'Inisiatif kolaboratif antara komunitas Panrita Lopi asal Tanah Beru, Bulukumba, bersama peneliti teknik perkapalan Universitas Hasanuddin ini bertujuan menekan konsumsi bahan bakar solar hingga 38 persen untuk pelayaran rute Makassar menuju kepulauan Nusa Tenggara dan Maluku.',
      '“Filosofi Phinisi sejak ratusan tahun lalu adalah berlayar selaras dengan arah angin dan arus laut,” ungkap Daeng Mansyur (54), nakhoda sekaligus pengawas galangan kapal kayu yang telah tiga dekade melaut. “Teknologi hibrida ini justru mengembalikan kemurnian pelayaran kami—mesin menjadi lebih hening, udara pelabuhan lebih bersih, dan biaya logistik pangan antar-pulau jauh lebih efisien.”',
      'Pemerintah Provinsi Sulawesi Selatan bersama koperasi pelayaran rakyat kini menyiapkan skema pendanaan hijau bagi dua puluh armada tambahan sepanjang kuartal keempat tahun ini, sekaligus membuka ruang dokumentasi publik bagi generasi muda yang ingin mempelajari arsitektur kayu tanpa paku khas Sulawesi Selatan.'
    ],
    pullQuote:
      'Filosofi Phinisi sejak ratusan tahun lalu adalah berlayar selaras dengan angin; teknologi bersih ini mengembalikan kemurnian pelayaran kami.',
    photos: [
      {
        url: makassarSunriseImg,
        caption: 'Fig. 01 — Siluet armada Phinisi yang bersandar di perairan Makassar saat fajar menyingsing.',
        photographer: 'Andi Pallawa / Redaksi Kareba’Ta'
      },
      {
        url: rammangRiverImg,
        caption: 'Fig. 02 — Jalur perairan pesisir dan sungai penyangga jalur logistik tradisional Sulawesi Selatan.',
        photographer: 'Andi Pallawa / Redaksi Kareba’Ta'
      },
      {
        url: cotoMakassarImg,
        caption: 'Fig. 03 — Jamuan hangat para awak kapal di dermaga sebelum memulai pelayaran lintas pulau.',
        photographer: 'Rizky Mattulada / Kareba’Ta'
      }
    ],
    authorName: 'Andi Pallawa Gau',
    authorRole: 'Jurnalis Maritim & Ekonomi Pesisir',
    authorEmail: 'pallawa@karebata.id',
    location: 'Makassar, Sulawesi Selatan',
    category: 'Inovasi Daerah',
    publishedAt: '2026-09-29T06:30:00+08:00',
    relativeTime: '2 jam lalu',
    formattedDate: '29 September 2026 · 06:30 WITA',
    readTimeMinutes: 4
  },
  {
    id: 'kareba-02',
    title: 'Kopi Arabika Lereng Sesean Toraja Tembus Lelang Spesialti Langsung ke Kyoto dan Oslo',
    summary:
      'Melalui sistem ketertelusuran kebun berbasis koperasi desa di ketinggian 1.750 meter, petani kopi Tana Toraja berhasil memangkas rantai tengkulak dan meraih harga beli tertinggi dalam satu dekade.',
    content: [
      'Kabut pagi belum sepenuhnya beranjak dari punggung Pegunungan Sesean ketika puluhan petani di Lembang Suloara mulai memetik ceri kopi merah ranum satu per satu. Tahun ini, hasil panen mereka tidak lagi dijual dalam karung curah tanpa identitas, melainkan dilengkapi kode lot mikro yang mencatat ketinggian kebun, varietas pohon, hingga tanggal fermentasi.',
      'Transformasi tata niaga ini digerakkan oleh Koperasi Produsen Kopi Pegunungan Toraja yang beranggotakan 420 kepala keluarga. Dengan menjaga standar petik merah 98 persen dan proses penjemuran rumah kaca alami (solar dryer dome), skor uji cita rasa (cupping score) kopi mereka menembus angka 88,5 poin.',
      '“Dulu petani hanya tahu kopi mereka dibawa turun ke kota, tanpa pernah tahu siapa yang menyeduhnya dan berapa nilai aslinya,” tutur Yohana Rante (37), koordinator pascapanen koperasi. “Kini pemanggang kopi independen dari Kyoto dan Oslo datang langsung ke kebun kami, menandatangani kontrak pembelian tahunan dengan harga hampir dua kali lipat harga pasar konvensional.”',
      'Sebagian keuntungan kolektif koperasi tahun ini dialokasikan untuk peremajaan pohon penaung endemik serta beasiswa pendidikan pertanian berkelanjutan bagi pemuda desa di Toraja Utara.'
    ],
    pullQuote:
      'Ketika kualitas petik merah dihargai secara transparan, generasi muda desa tidak lagi melihat kebun kopi sebagai masa lalu, melainkan masa depan.',
    photos: [
      {
        url: torajaCoffeeImg,
        caption: 'Fig. 01 — Panen ceri kopi Arabika merah matang di kebun warga lereng Gunung Sesean, Toraja Utara.',
        photographer: 'Yohana Rante / Kontributor Toraja'
      },
      {
        url: sengkangSilkImg,
        caption: 'Fig. 02 — Ketelitian tangan pengrajin dan petani dataran tinggi Sulawesi dalam menjaga mutu komoditas lokal.',
        photographer: 'Arsip Visual Kareba’Ta'
      }
    ],
    authorName: 'Lukas Pongtiku',
    authorRole: 'Koresponden Dataran Tinggi Toraja',
    authorEmail: 'lukas@karebata.id',
    location: 'Toraja Utara, Sulawesi Selatan',
    category: 'Ekonomi Lokal',
    publishedAt: '2026-09-29T04:45:00+08:00',
    relativeTime: '4 jam lalu',
    formattedDate: '29 September 2026 · 04:45 WITA',
    readTimeMinutes: 5
  },
  {
    id: 'kareba-03',
    title: 'Menjaga Hening Sungai Pute: Warga Rammang-Rammang Batasi Kuota Perahu Bermotor',
    summary:
      'Demi melindungi ekosistem karst terbesar ketiga di dunia dari getaran akustik dan pencemaran air, desa wisata Rammang-Rammang di Maros meresmikan koridor perahu dayung dan listrik hening.',
    content: [
      'Menyusuri Sungai Pute di kawasan Geopark Nasional Maros-Pangkep kini menghadirkan suasana yang jauh lebih hening. Suara deru mesin tempel berbahan bakar bensin yang dulu menggema di antara dinding tebing kapur berusia jutaan tahun, kini berganti dengan kecipak dayung kayu dan desis halus motor listrik bertenaga baterai.',
      'Keputusan berani ini lahir dari musyawarah adat dan kelompok sadar wisata Desa Salenrang. Penelitian ekologis menunjukkan bahwa getaran suara bising di lorong sempit sungai karst mengganggu koloni kelelawar penyerbuk gua serta mempercepat erosi tebing tepi air.',
      '“Wisatawan datang ke Rammang-Rammang untuk mendengar suara burung raja udang, gesekan daun nipah, dan tetesan air stalaktit—bukan suara knalpot,” jelas Iwan Dento, penggerak ekowisata lokal yang sejak awal merintis konservasi lembah karst tersebut. “Dengan membatasi kuota kunjungan harian melalui aplikasi reservasi desa dan beralih ke perahu hening, nilai pengalaman wisata justru meningkat.”',
      'Selama enam bulan uji coba, tingkat kepuasan pengunjung meningkat tajam sementara populasi biota air tawar seperti udang sungai dan ikan endemik Maros kembali mudah dijumpai di perairan dangkal sekitar dermaga Kampung Berua.'
    ],
    pullQuote:
      'Wisatawan datang ke lembah karst ini untuk mendengar napas alam dan gemericik air purba, bukan deru mesin.',
    photos: [
      {
        url: rammangRiverImg,
        caption: 'Fig. 01 — Perahu kayu melintasi alur Sungai Pute yang tenang di celah menara karst Rammang-Rammang, Kabupaten Maros.',
        photographer: 'Fadel Muhammad / Kareba’Ta'
      },
      {
        url: makassarSunriseImg,
        caption: 'Fig. 02 — Keterhubungan ekosistem sungai karst Maros hingga pesisir Selat Makassar.',
        photographer: 'Andi Pallawa / Kareba’Ta'
      }
    ],
    authorName: 'Siti Rahmah Syam',
    authorRole: 'Editor Lingkungan & Geopark',
    authorEmail: 'rahmah@karebata.id',
    location: 'Maros, Sulawesi Selatan',
    category: 'Alam & Lingkungan',
    publishedAt: '2026-09-28T19:20:00+08:00',
    relativeTime: '14 jam lalu',
    formattedDate: '28 September 2026 · 19:20 WITA',
    readTimeMinutes: 4
  },
  {
    id: 'kareba-04',
    title: 'Helai Zamrud dari Wajo: Ketika Penenun Muda Sengkang Menghidupkan Motif Lontara Kuno',
    summary:
      'Generasi baru penenun di tepian Danau Tempe mendigitalisasi arsip motif sutra Bugis berusia seabad dan memadukannya dengan pewarna alami daun tarum serta kulit kayu secang.',
    content: [
      'Bunyi hentakan kayu walida pada alat tenun bukan mesin (ATBM) terdengar berirama dari kolong rumah panggung di Desa Pakkanna, Kecamatan Tanasitolo, Kabupaten Wajo. Di balik alat tenun kayu jati tersebut, Besse Tenri (24) tengah menyusun benang pakan berwarna hijau zamrud tua yang dicelup dari fermentasi daun tarum lokal.',
      'Bersama dua belas penenun muda lulusan desain tekstil dan pemuda desa, Tenri menginisiasi Ruang Arsip Lipa Sabbe. Mereka mengunjungi para maestro tenun berusia lanjut di pelosok Wajo untuk mendokumentasikan kembali motif-motif klasik seperti Balo Renni,ាន់ Coboka, dan Cobo yang nyaris terlupakan akibat gempuran tekstil cetak pabrik.',
      '“Setiap silangan benang pada Lipa Sabbe mengandung pesan filosofis tentang keteguhan hati dan kejujuran masyarakat Bugis,” ujar Besse Tenri sembari merapikan gulungan benang emas. “Kami mencatat rumus hitung benangnya dalam katalog digital terbuka, sehingga penenun muda bisa mempelajarinya dengan presisi tinggi.”',
      'Karya sutra pewarna alam dari komunitas ini kini tidak hanya dipesan untuk busana adat pernikahan, tetapi juga dikoleksi oleh kurator tekstil kriya kontemporer di Jakarta, Singapura, hingga Milan.'
    ],
    pullQuote:
      'Setiap silangan benang pada Lipa Sabbe menyimpan ingatan kolektif yang tidak boleh putus di tangan generasi kami.',
    photos: [
      {
        url: sengkangSilkImg,
        caption: 'Fig. 01 — Proses penenunan kain sutra Bugis Lipa Sabbe dengan kombinasi benang hijau zamrud dan emas di Sengkang, Wajo.',
        photographer: 'Tenri Abeng / Kareba’Ta'
      },
      {
        url: torajaCoffeeImg,
        caption: 'Fig. 02 — Tanaman pewarna alami yang dibudidayakan secara tumpang sari di kebun warga Sulawesi Selatan.',
        photographer: 'Arsip Kareba’Ta'
      }
    ],
    authorName: 'Besse Tenri Olle',
    authorRole: 'Kurator Budaya & Kriya Nusantara',
    authorEmail: 'tenri@karebata.id',
    location: 'Sengkang, Kab. Wajo',
    category: 'Budaya & Warisan',
    publishedAt: '2026-09-28T15:10:00+08:00',
    relativeTime: '18 jam lalu',
    formattedDate: '28 September 2026 · 15:10 WITA',
    readTimeMinutes: 6
  },
  {
    id: 'kareba-05',
    title: 'Dapur Tanah Liat & Empat Puluh Rempah: Rahasia Kuah Tradisi yang Melintasi Generasi',
    summary:
      'Dari sangrai kacang tanah tumbuk hingga rebusan kuali gerabah berjam-jam, para peracik kuliner warisan di Makassar mempertahankan teknik masak lambat di tengah arus makanan cepat saji.',
    content: [
      'Aroma lengkuas, serai, ketumbar sangrai, dan jintan langsung menyergap indra penciuman begitu tirai dapur kayu di Jalan Gagak dibuka pukul lima pagi. Di atas tungku bara kayu asam, tiga kuali tanah liat berukuran besar tampak mengepulkan uap hangat yang kental dan harum.',
      'Memasak hidangan berkuah rempah khas Makassar menggunakan kuali gerabah (korong butta) bukan sekadar romantisme masa lalu. Pori-pori tanah liat mendistribusikan panas secara perlahan dan merata, memungkinkan empat puluh jenis rempah-rempah atau রম্পা patang pulo meresap sempurna tanpa merusak tekstur kaldu.',
      '“Kalau dimasak terburu-buru dengan api besar di panci logam tipis, wangi rempahnya hanya menempel di permukaan,” terang Hajah Nurlia (62), yang melanjutkan usaha kuliner keluarganya sejak tahun 1978. “Kuali tanah liat dan ketupat pembungkus daun pandan segar memberi aroma tanah dan daun yang tidak tergantikan oleh bahan instan.”',
      'Kini, sejumlah koki muda di Makassar mulai mendokumentasikan takaran gramasi empat puluh rempah tersebut agar warisan gastronomi Sulawesi Selatan tetap terjaga keasliannya sekaligus siap diajukan sebagai warisan budaya takbenda dunia.'
    ],
    pullQuote:
      'Kuali tanah liat dan ketupat daun pandan segar memberi jiwa pada empat puluh rempah yang dimasak dengan kesabaran.',
    photos: [
      {
        url: cotoMakassarImg,
        caption: 'Fig. 01 — Sajian kuliner rempah khas Makassar dalam mangkuk tanah liat bersama ketupat pandan dan jeruk nipis.',
        photographer: 'Rizky Mattulada / Kareba’Ta'
      },
      {
        url: makassarSunriseImg,
        caption: 'Fig. 02 — Aktivitas pagi di pesisir Makassar yang sejak abad ke-16 menjadi titik temu jalur perdagangan rempah Nusantara.',
        photographer: 'Andi Pallawa / Kareba’Ta'
      }
    ],
    authorName: 'Rizky Mattulada',
    authorRole: 'Penulis Gastronomi & Sejarah Kota',
    authorEmail: 'rizky@karebata.id',
    location: 'Makassar, Sulawesi Selatan',
    category: 'Kuliner Nusantara',
    publishedAt: '2026-09-28T09:00:00+08:00',
    relativeTime: '1 hari lalu',
    formattedDate: '28 September 2026 · 09:00 WITA',
    readTimeMinutes: 5
  }
];
