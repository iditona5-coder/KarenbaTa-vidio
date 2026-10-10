export interface FlutterCodeFile {
  path: string;
  title: string;
  description: string;
  code: string;
}

export const FLUTTER_PROJECT_FILES: FlutterCodeFile[] = [
  {
    path: 'pubspec.yaml',
    title: 'Konfigurasi Dependensi Flutter (Termasuk Video Player & Image Picker)',
    description: 'Menggunakan Flutter terbaru, Material 3, Provider, Firebase Auth, Cloud Firestore, Firebase Storage, image_picker, dan video_player.',
    code: `name: karebata
description: "Kareba'Ta - Aplikasi berita dan informasi lokal bergaya majalah digital modern."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.4.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  # State Management
  provider: ^6.1.2
  # Firebase Core & Services
  firebase_core: ^3.6.0
  firebase_auth: ^5.3.1
  google_sign_in: ^6.2.1
  cloud_firestore: ^5.4.4
  firebase_storage: ^12.3.3
  # Media (Foto & Video dari Galeri), Typography & Share
  image_picker: ^1.1.2
  video_player: ^2.9.2
  cached_network_image: ^3.4.1
  share_plus: ^10.0.2
  intl: ^0.19.0
  google_fonts: ^6.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true`
  },
  {
    path: 'lib/main.dart',
    title: 'Entry Point & Tema Material 3 (Putih & Aksen Hijau)',
    description: 'Inisialisasi Firebase, MultiProvider, konfigurasi Material 3 elegan, dan Bottom Navigation 5 menu.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'providers/auth_provider.dart';
import 'providers/news_provider.dart';
import 'screens/main_scaffold.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const KarebataApp());
}

class KarebataApp extends StatelessWidget {
  const KarebataApp({super.key});

  static const Color kPrimaryGreen = Color(0xFF14532D);
  static const Color kAccentGreen = Color(0xFF15803D);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => KarebataAuthProvider()),
        ChangeNotifierProvider(create: (_) => NewsProvider()..fetchNewsStream()),
      ],
      child: MaterialApp(
        title: "Kareba'Ta",
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: Colors.white,
          colorScheme: ColorScheme.fromSeed(
            seedColor: kPrimaryGreen,
            primary: kPrimaryGreen,
            secondary: kAccentGreen,
            surface: Colors.white,
            brightness: Brightness.light,
          ),
          textTheme: GoogleFonts.plusJakartaSansTextTheme().copyWith(
            displayLarge: GoogleFonts.newsreader(
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1C1917),
            ),
            headlineMedium: GoogleFonts.newsreader(
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1C1917),
            ),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Color(0xFF1C1917),
            elevation: 0,
            scrolledUnderElevation: 0.5,
            centerTitle: false,
          ),
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: Colors.white,
            indicatorColor: const Color(0xFFDCFCE7),
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: kPrimaryGreen,
                );
              }
              return const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Color(0xFF78716C),
              );
            }),
          ),
        ),
        home: const MainScaffold(),
      ),
    );
  }
}`
  },
  {
    path: 'lib/models/news_model.dart',
    title: 'Model Data Berita (Mendukung Foto & Video dari Galeri)',
    description: 'Representasi dokumen berita dengan dukungan multi-foto serta video liputan (videoUrl), ringkasan 3 baris, lokasi, penulis, dan waktu unggah.',
    code: `import 'package:cloud_firestore/cloud_firestore.dart';

class NewsModel {
  final String id;
  final String title;
  final String summary;
  final String content;
  final List<String> imageUrls;
  final String? videoUrl; // URL video berita dari galeri yang diunggah ke Firebase Storage
  final String authorId;
  final String authorName;
  final String location;
  final String category;
  final DateTime createdAt;

  const NewsModel({
    required this.id,
    required this.title,
    required this.summary,
    required this.content,
    required this.imageUrls,
    this.videoUrl,
    required this.authorId,
    required this.authorName,
    required this.location,
    required this.category,
    required this.createdAt,
  });

  bool get hasVideo => videoUrl != null && videoUrl!.isNotEmpty;
  String get coverImage => imageUrls.isNotEmpty ? imageUrls.first : '';

  factory NewsModel.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    final Timestamp? ts = data['createdAt'] as Timestamp?;
    return NewsModel(
      id: doc.id,
      title: data['title'] ?? '',
      summary: data['summary'] ?? '',
      content: data['content'] ?? '',
      imageUrls: List<String>.from(data['imageUrls'] ?? []),
      videoUrl: data['videoUrl'] as String?,
      authorId: data['authorId'] ?? '',
      authorName: data['authorName'] ?? 'Redaksi Kareba\\'Ta',
      location: data['location'] ?? 'Sulawesi Selatan',
      category: data['category'] ?? 'Lokal',
      createdAt: ts != null ? ts.toDate() : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'summary': summary,
      'content': content,
      'imageUrls': imageUrls,
      'videoUrl': videoUrl,
      'authorId': authorId,
      'authorName': authorName,
      'location': location,
      'category': category,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}`
  },
  {
    path: 'lib/providers/news_provider.dart',
    title: 'Provider Berita: Unggah Video & Foto dari Galeri ke Firebase Storage',
    description: 'Mengelola stream berita real-time, unggah file video (.mp4/.mov) serta foto dari galeri perangkat ke Firebase Storage, dan menyimpannya ke Cloud Firestore.',
    code: `import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/news_model.dart';

class NewsProvider extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  List<NewsModel> _articles = [];
  final Set<String> _savedIds = {};
  String _searchQuery = '';
  bool _isUploading = false;

  List<NewsModel> get articles => _articles;
  bool get isUploading => _isUploading;

  List<NewsModel> get filteredArticles {
    if (_searchQuery.trim().isEmpty) return _articles;
    final q = _searchQuery.toLowerCase();
    return _articles.where((item) {
      return item.title.toLowerCase().contains(q) ||
          item.summary.toLowerCase().contains(q) ||
          item.location.toLowerCase().contains(q) ||
          item.authorName.toLowerCase().contains(q);
    }).toList();
  }

  List<NewsModel> get savedArticles =>
      _articles.where((item) => _savedIds.contains(item.id)).toList();

  void fetchNewsStream() {
    _firestore
        .collection('news')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .listen((snapshot) {
      _articles = snapshot.docs
          .map((doc) => NewsModel.fromFirestore(doc))
          .toList();
      notifyListeners();
    });
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  bool isSaved(String newsId) => _savedIds.contains(newsId);

  void toggleSave(String newsId) {
    if (_savedIds.contains(newsId)) {
      _savedIds.remove(newsId);
    } else {
      _savedIds.add(newsId);
    }
    notifyListeners();
  }

  Future<void> createNews({
    required String title,
    required String summary,
    required String content,
    required String location,
    required String category,
    required String authorId,
    required String authorName,
    required List<File> imageFiles,
    File? videoFile, // File video dari galeri perangkat
  }) async {
    _isUploading = true;
    notifyListeners();

    try {
      String? uploadedVideoUrl;

      // 1. Jika pengguna memilih video dari galeri, unggah ke Firebase Storage
      if (videoFile != null) {
        final videoRef = _storage.ref().child(
              'news_videos/\${DateTime.now().millisecondsSinceEpoch}.mp4',
            );
        final metadata = SettableMetadata(contentType: 'video/mp4');
        await videoRef.putFile(videoFile, metadata);
        uploadedVideoUrl = await videoRef.getDownloadURL();
      }

      // 2. Unggah foto-foto pendamping dari galeri ke Firebase Storage
      final List<String> uploadedImageUrls = [];
      for (int i = 0; i < imageFiles.length; i++) {
        final imgRef = _storage.ref().child(
              'news_images/\${DateTime.now().millisecondsSinceEpoch}_\$i.jpg',
            );
        await imgRef.putFile(imageFiles[i]);
        final url = await imgRef.getDownloadURL();
        uploadedImageUrls.add(url);
      }

      // 3. Simpan dokumen berita ke Cloud Firestore
      final docRef = _firestore.collection('news').doc();
      final news = NewsModel(
        id: docRef.id,
        title: title,
        summary: summary,
        content: content,
        imageUrls: uploadedImageUrls,
        videoUrl: uploadedVideoUrl,
        authorId: authorId,
        authorName: authorName,
        location: location,
        category: category,
        createdAt: DateTime.now(),
      );

      await docRef.set(news.toMap());
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }
}`
  },
  {
    path: 'lib/screens/home_screen.dart',
    title: 'Beranda Majalah Digital (PageView.builder + PageScrollPhysics + Video Player)',
    description: 'Sistem scroll vertikal seperti Instagram Reels dengan dukungan pemutaran otomatis berita video maupun foto layar penuh.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../models/news_model.dart';
import '../providers/news_provider.dart';
import 'detail_screen.dart';

/// Custom PageScrollPhysics ala Instagram Reels:
/// - Memastikan halaman selalu berhenti tepat pada 1 berita penuh (tidak pernah di tengah).
/// - Sensitivitas geser nyaman: sedikit swipe langsung berpindah tepat 1 berita.
class ReelsPageScrollPhysics extends PageScrollPhysics {
  const ReelsPageScrollPhysics({super.parent});

  @override
  ReelsPageScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return ReelsPageScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 80,
        stiffness: 110,
        damping: 1.15,
      );

  @override
  double get minFlingDistance => 18.0;

  @override
  double get minFlingVelocity => 240.0;

  @override
  double get maxFlingVelocity => 2200.0;
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final PageController _pageController = PageController(
    initialPage: 0,
    keepPage: true,
    viewportFraction: 1.0, // Satu berita wajib memenuhi 1 layar penuh (100%)
  );

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final articles = context.watch<NewsProvider>().articles;

    if (articles.isEmpty) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF15803D)),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        pageSnapping: true, // Wajib berhenti tepat pada 1 berita, bukan free scroll
        allowImplicitScrolling: true,
        physics: const ReelsPageScrollPhysics(
          parent: ClampingScrollPhysics(),
        ),
        itemCount: articles.length,
        itemBuilder: (context, index) {
          final article = articles[index];

          return AnimatedBuilder(
            animation: _pageController,
            builder: (context, child) {
              double pageOffset = 0.0;
              if (_pageController.position.haveDimensions) {
                pageOffset = (_pageController.page ?? _pageController.initialPage.toDouble()) - index;
              }
              final double clampedDelta = pageOffset.abs().clamp(0.0, 1.0);
              final double scale = 1.0 - (clampedDelta * 0.035);
              final double opacity = 1.0 - (clampedDelta * 0.35);

              return Opacity(
                opacity: opacity,
                child: Transform.scale(
                  scale: scale,
                  child: child,
                ),
              );
            },
            child: MagazineFullPageCard(article: article),
          );
        },
      ),
    );
  }
}

class MagazineFullPageCard extends StatefulWidget {
  final NewsModel article;

  const MagazineFullPageCard({super.key, required this.article});

  @override
  State<MagazineFullPageCard> createState() => _MagazineFullPageCardState();
}

class _MagazineFullPageCardState extends State<MagazineFullPageCard> {
  VideoPlayerController? _videoController;
  bool _isMuted = false;

  @override
  void initState() {
    super.initState();
    if (widget.article.hasVideo) {
      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(widget.article.videoUrl!),
      )..initialize().then((_) {
          if (mounted) {
            setState(() {});
            _videoController!
              ..setLooping(true)
              ..play();
          }
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  void _toggleMute() {
    if (_videoController == null) return;
    setState(() {
      _isMuted = !_isMuted;
      _videoController!.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final article = widget.article;
    final timeStr = DateFormat('dd MMM yyyy · HH:mm').format(article.createdAt);

    return Stack(
      fit: StackFit.expand,
      children: [
        // 1. Video atau Foto di Feed: Lebar Penuh (fitWidth / AspectRatio)
        // Tidak terpotong atas-bawah sama sekali, dan bar berada di atas & bawah saja
        Center(
          child: (article.hasVideo &&
                  _videoController != null &&
                  _videoController!.value.isInitialized)
              ? SizedBox(
                  width: double.infinity,
                  child: AspectRatio(
                    aspectRatio: _videoController!.value.aspectRatio,
                    child: VideoPlayer(_videoController!),
                  ),
                )
              : CachedNetworkImage(
                  imageUrl: article.coverImage,
                  width: double.infinity,
                  fit: BoxFit.fitWidth, // Lebar penuh kiri-kanan, tinggi utuh sesuai rasio asli tanpa memotong atas-bawah
                  placeholder: (_, __) => Container(color: const Color(0xFF1C1917)),
                  errorWidget: (_, __, ___) => Container(color: const Color(0xFF1C1917)),
                ),
        ),

        // 2. Konten Majalah di Bagian Bawah (Media Jernih Tanpa Gradasi Hitam Atas/Bawah)
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Logo Resmi Kareba'Ta (Pin Emas + Hijau Botol 0xFF006837 + Emas 0xFFEAA000)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Pin Lokasi Kuning Emas dengan Huruf K Putih
                        Container(
                          width: 28,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAA000),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(14),
                              bottom: Radius.circular(4),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            "K",
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            RichText(
                              text: TextSpan(
                                style: GoogleFonts.poppins(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                ),
                                children: const [
                                  TextSpan(text: "Kareba'", style: TextStyle(color: Color(0xFF006837))),
                                  TextSpan(text: "Ta", style: TextStyle(color: Color(0xFFEAA000))),
                                ],
                              ),
                            ),
                            Text(
                              "beritamu suaramu",
                              style: GoogleFonts.poppins(
                                color: const Color(0xFFEAA000),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (article.hasVideo)
                      IconButton(
                        onPressed: _toggleMute,
                        icon: Icon(
                          _isMuted ? Icons.volume_off : Icons.volume_up,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
                const Spacer(),

                // Metadata: Lokasi · Waktu Unggah · Nama Penulis
                Text(
                  '\${article.location}  ·  \$timeStr  ·  \${article.authorName}',
                  style: const TextStyle(
                    color: Color(0xFFD6D3D1),
                    fontSize: 12,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 10),

                // Deskripsi Berita (Ukuran Besar Seperti Judul, Maksimal 3 Baris)
                Text(
                  article.summary,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.newsreader(
                    color: Colors.white,
                    fontSize: 30,
                    height: 1.18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 20),

                // Tombol "Baca Selengkapnya"
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF15803D),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 22,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    _videoController?.pause();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => DetailScreen(article: article),
                      ),
                    );
                  },
                  icon: const Icon(Icons.menu_book_outlined, size: 18),
                  label: const Text(
                    'Baca Selengkapnya',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}`
  },
  {
    path: 'lib/screens/create_news_screen.dart',
    title: 'Halaman Buat Kabar (Pilih Video & Foto dari Galeri Android)',
    description: 'Formulir pembuatan berita yang memungkinkan pengguna memilih video dari galeri (ImagePicker.pickVideo) maupun multi-foto, melihat pratinjau video, dan mengunggahnya ke Firebase.',
    code: `import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/news_provider.dart';
import '../providers/auth_provider.dart';

class CreateNewsScreen extends StatefulWidget {
  const CreateNewsScreen({super.key});

  @override
  State<CreateNewsScreen> createState() => _CreateNewsScreenState();
}

class _CreateNewsScreenState extends State<CreateNewsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _summaryCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _locationCtrl = TextEditingController(text: 'Makassar, Sulawesi Selatan');

  final ImagePicker _picker = ImagePicker();
  final List<File> _selectedImages = [];
  File? _selectedVideo;
  VideoPlayerController? _previewVideoController;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _summaryCtrl.dispose();
    _contentCtrl.dispose();
    _locationCtrl.dispose();
    _previewVideoController?.dispose();
    super.dispose();
  }

  /// Pilih Video Berita dari Galeri Perangkat
  Future<void> _pickVideoFromGallery() async {
    final XFile? pickedVideo = await _picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(minutes: 5),
    );

    if (pickedVideo != null) {
      final file = File(pickedVideo.path);
      _previewVideoController?.dispose();

      final controller = VideoPlayerController.file(file);
      await controller.initialize();

      setState(() {
        _selectedVideo = file;
        _previewVideoController = controller;
      });
    }
  }

  /// Pilih Banyak Foto dari Galeri Perangkat
  Future<void> _pickImagesFromGallery() async {
    final List<XFile> pickedFiles = await _picker.pickMultiImage(imageQuality: 85);
    if (pickedFiles.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(pickedFiles.map((x) => File(x.path)));
      });
    }
  }

  Future<void> _submitNews() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedVideo == null && _selectedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih minimal 1 video atau foto dari galeri.')),
      );
      return;
    }

    final auth = context.read<KarebataAuthProvider>();
    final newsProvider = context.read<NewsProvider>();

    await newsProvider.createNews(
      title: _titleCtrl.text.trim(),
      summary: _summaryCtrl.text.trim(),
      content: _contentCtrl.text.trim(),
      location: _locationCtrl.text.trim(),
      category: 'Liputan Warga',
      authorId: auth.user?.uid ?? 'guest',
      authorName: auth.user?.displayName ?? 'Jurnalis Warga',
      imageFiles: _selectedImages,
      videoFile: _selectedVideo,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Berita berhasil diterbitkan ke Beranda!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isUploading = context.watch<NewsProvider>().isUploading;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Buat Kabar Baru',
          style: GoogleFonts.newsreader(fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tombol Pilih Video & Foto dari Galeri
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF15803D),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: _pickVideoFromGallery,
                      icon: const Icon(Icons.video_library_outlined),
                      label: const Text('Pilih Video Galeri'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: _pickImagesFromGallery,
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Pilih Foto Galeri'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Pratinjau Video dari Galeri jika dipilih
              if (_selectedVideo != null &&
                  _previewVideoController != null &&
                  _previewVideoController!.value.isInitialized)
                Container(
                  height: 220,
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 16),
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      AspectRatio(
                        aspectRatio: _previewVideoController!.value.aspectRatio,
                        child: VideoPlayer(_previewVideoController!),
                      ),
                      IconButton.filled(
                        onPressed: () {
                          setState(() {
                            _previewVideoController!.value.isPlaying
                                ? _previewVideoController!.pause()
                                : _previewVideoController!.play();
                          });
                        },
                        icon: Icon(
                          _previewVideoController!.value.isPlaying
                              ? Icons.pause
                              : Icons.play_arrow,
                        ),
                      ),
                    ],
                  ),
                ),

              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(
                  labelText: 'Judul Berita',
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.trim().length < 10) ? 'Minimal 10 karakter' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _locationCtrl,
                decoration: const InputDecoration(
                  labelText: 'Lokasi Liputan',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _summaryCtrl,
                maxLines: 3,
                maxLength: 240,
                decoration: const InputDecoration(
                  labelText: 'Ringkasan (Maksimal 3 Baris di Beranda)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _contentCtrl,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: 'Isi Berita Lengkap',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF14532D),
                  ),
                  onPressed: isUploading ? null : _submitNews,
                  child: isUploading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Terbitkan Kabar ke Beranda'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}`
  },
  {
    path: 'lib/screens/detail_screen.dart',
    title: 'Halaman Detail Berita Lengkap & Galeri Multi-Foto/Video',
    description: 'Menampilkan seluruh foto & video berita, isi berita lengkap, tanggal, penulis, tombol Bagikan, dan tombol Simpan.',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../models/news_model.dart';
import '../providers/news_provider.dart';

class DetailScreen extends StatefulWidget {
  final NewsModel article;

  const DetailScreen({super.key, required this.article});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  int _activePhotoIndex = 0;

  @override
  Widget build(BuildContext context) {
    final newsProvider = context.watch<NewsProvider>();
    final isSaved = newsProvider.isSaved(widget.article.id);
    final formattedDate =
        DateFormat('dd MMMM yyyy · HH:mm').format(widget.article.createdAt);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "Kareba'Ta",
          style: GoogleFonts.newsreader(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            tooltip: 'Simpan Berita',
            onPressed: () => newsProvider.toggleSave(widget.article.id),
            icon: Icon(
              isSaved ? Icons.bookmark : Icons.bookmark_border,
              color: isSaved ? const Color(0xFF15803D) : const Color(0xFF1C1917),
            ),
          ),
          IconButton(
            tooltip: 'Bagikan Berita',
            onPressed: () {
              Share.share(
                '\${widget.article.title}\\n\\nBaca selengkapnya di aplikasi Kareba\\'Ta (\${widget.article.location}).',
              );
            },
            icon: const Icon(Icons.share_outlined),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Galeri Semua Foto (jika lebih dari satu)
                if (widget.article.imageUrls.isNotEmpty)
                  SizedBox(
                    height: 360,
                    child: Stack(
                      children: [
                        PageView.builder(
                          itemCount: widget.article.imageUrls.length,
                          onPageChanged: (idx) =>
                              setState(() => _activePhotoIndex = idx),
                          itemBuilder: (context, index) {
                            return CachedNetworkImage(
                              imageUrl: widget.article.imageUrls[index],
                              fit: BoxFit.cover,
                              width: double.infinity,
                            );
                          },
                        ),
                        if (widget.article.imageUrls.length > 1)
                          Positioned(
                            bottom: 16,
                            right: 16,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              color: Colors.black87,
                              child: Text(
                                'Foto \${_activePhotoIndex + 1} / \${widget.article.imageUrls.length}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Lokasi & Tanggal
                      Text(
                        '\${widget.article.location}  ·  \$formattedDate',
                        style: const TextStyle(
                          color: Color(0xFF15803D),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Deskripsi Utama (Ukuran Sebesar Judul)
                      Text(
                        widget.article.summary,
                        style: GoogleFonts.newsreader(
                          fontSize: 30,
                          height: 1.22,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1C1917),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Nama Penulis
                      Text(
                        'Ditulis oleh \${widget.article.authorName}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF57534E),
                        ),
                      ),
                      const Divider(height: 36, color: Color(0xFFE7E5E4)),

                      // Isi Berita Lengkap
                      Text(
                        widget.article.content,
                        style: const TextStyle(
                          fontSize: 16,
                          height: 1.75,
                          color: Color(0xFF292524),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}`
  }
];
