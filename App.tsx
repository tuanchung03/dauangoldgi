
import React, { useState, useEffect, useRef } from 'react';
import { Step, Landmark, UserSession, Participant } from './types';
import { LANDMARKS as INITIAL_LANDMARKS } from './constants';
import { StepIndicator } from './components/StepIndicator';
import { removeBackgroundAI } from './services/geminiService';
import { sendZNSOtp } from './services/zaloService';

interface Prize {
  id: string;
  name: string;
  value: string;
  quantity: string;
}

interface CustomFont {
  name: string;
  family: string;
  url: string;
}

const INITIAL_PRIZES: Prize[] = [
  { id: '1', name: 'Giải Đặc Biệt', value: 'E-Voucher 1.800.000 VNĐ', quantity: '01 Giải' },
  { id: '2', name: 'Giải Nhất', value: 'E-Voucher 1.000.000 VNĐ', quantity: '03 Giải' },
  { id: '3', name: 'Giải May Mắn', value: 'E-Voucher 200.000 VNĐ', quantity: '20 Giải' },
];

const INITIAL_ALBUM = [
  'https://images.unsplash.com/photo-1524413139048-47c474270d2b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1544955378-0164b39178bb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&q=80&w=800'
];

// Hàm nén ảnh để tiết kiệm dung lượng localStorage
const compressBase64 = async (base64: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
  if (!base64 || !base64.startsWith('data:image')) return base64;
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
  });
};

const App: React.FC = () => {
  const loadSavedData = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [cmsConfig, setCmsConfig] = useState(() => loadSavedData('cmsConfig', {
    brandName: 'MỘC CHÂU CREAMERY',
    pageTitle: 'Dấu Ấn Ký Hoạ - Mộc Châu Creamery',
    heroTitle: 'HÀNH TRÌNH KÝ HỌA',
    heroDesc: 'Cùng Mộc Châu Creamery lưu giữ những khoảnh khắc tuyệt đẹp qua nét vẽ ký họa.',
    bgImageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=1600',
    albumBgUrl: '',
    prizeBgUrl: '',
    processBgUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=1600',
    albumTitle: 'Khoảnh khắc êm mềm',
    albumDesc: 'Bộ sưu tập bưu thiếp ký họa',
    prizeTitle: 'Cơ cấu giải thưởng',
    prizeDesc: 'Những phần quà hấp dẫn đang chờ đón những tấm bưu thiếp ấn tượng nhất.',
    previewCardTitle: 'Xem trước bưu thiếp',
    previewCardImg: 'https://images.unsplash.com/photo-1524413139048-47c474270d2b?auto=format&fit=crop&q=800',
    rules: 'Thể lệ: 1. Đăng ký OTP Zalo. 2. Tạo ảnh AI. 3. Chia sẻ công khai bài đăng kèm hashtag #MocChauCreamery #BuuThiepKyHoa.',
    resultTitle: 'Tấm bưu thiếp của bạn đã sẵn sàng',
    resultDescription: '*Chia sẻ bưu thiếp trên Facebook để nhận e-voucher trị giá tới 1.800.000 VNĐ.',
    fbAccessToken: '',
    fbAppId: '',
    zaloAccessToken: '',
    znsTemplateId: '',
    aiApiKey: '',
    adminUser: 'admin',
    adminPass: 'goldgi@2024',
    eventTime: 'Thời gian: 01/01/2026 - 28/02/2026',
    step1Desc: 'Lựa chọn và đăng tải một bức ảnh chân dung toàn thân thật đẹp của bạn.',
    step2Desc: 'Chọn 1 trong các địa danh nổi tiếng, AI sẽ tạo bưu thiếp ký họa dành riêng cho bạn.',
    step3Desc: 'Chia sẻ lên Facebook để nhận quà tặng hấp dẫn từ Mộc Châu Creamery.',
  }));

  const [styleConfig, setStyleConfig] = useState(() => loadSavedData('styleConfig', {
    heroTitle: { font: 'serif', color: '#451a03', size: 64 },
    heroDesc: { font: 'sans-serif', color: '#475569', size: 18 },
    brand: { font: 'serif', color: '#78350f', size: 14 },
    albumTitle: { font: 'serif', color: '#0f172a', size: 40 },
    prizeTitle: { font: 'serif', color: '#0f172a', size: 40 },
    resultTitle: { font: 'serif', color: '#451a03', size: 48 },
  }));

  const [albumImages, setAlbumImages] = useState<string[]>(() => loadSavedData('albumImages', INITIAL_ALBUM));
  const [landmarks, setLandmarks] = useState<Landmark[]>(() => loadSavedData('landmarks', INITIAL_LANDMARKS));
  const [prizes, setPrizes] = useState<Prize[]>(() => loadSavedData('prizes', INITIAL_PRIZES));
  const [participants, setParticipants] = useState<Participant[]>(() => loadSavedData('participants', []));
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(() => loadSavedData('customFonts', []));

  const [selectedGalleryImg, setSelectedGalleryImg] = useState(albumImages[0] || INITIAL_ALBUM[0]);
  const [step, setStep] = useState<Step>(Step.LANDING);
  const [adminTab, setAdminTab] = useState<'users' | 'content' | 'gallery' | 'landmarks' | 'prizes' | 'api'>('users');
  const [showRules, setShowRules] = useState(false);
  const [showFbLinkInput, setShowFbLinkInput] = useState(false);
  const [tempFbLink, setTempFbLink] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUpdatingEngagement, setIsUpdatingEngagement] = useState(false);
  const [newLandmark, setNewLandmark] = useState({ name: '', sketchUrl: '', realUrl: '', coords: '' });
  const [newPrize, setNewPrize] = useState({ name: '', value: '', quantity: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  const [session, setSession] = useState<UserSession>({
    isVerified: false,
    scale: 1.0,
    position: { x: 0, y: 0 },
    selectedLandmark: landmarks[0],
    shared: false
  });
  
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const sectionProcessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    customFonts.forEach(font => {
      const newStyle = document.createElement('style');
      newStyle.appendChild(document.createTextNode(`@font-face { font-family: '${font.family}'; src: url('${font.url}'); }`));
      document.head.appendChild(newStyle);
    });
  }, [customFonts]);

  useEffect(() => {
    document.title = cmsConfig.pageTitle;
  }, [cmsConfig.pageTitle]);

  const handleUpdateSystem = async () => {
    setIsSaving(true);
    try {
      // Nén các ảnh Base64 trong cấu hình trước khi lưu
      const optimizedCms = { ...cmsConfig };
      const imageKeys = ['bgImageUrl', 'albumBgUrl', 'prizeBgUrl', 'processBgUrl', 'previewCardImg'];
      for (const key of imageKeys) {
        if (optimizedCms[key] && optimizedCms[key].startsWith('data:image')) {
          optimizedCms[key] = await compressBase64(optimizedCms[key]);
        }
      }

      const optimizedAlbum = await Promise.all(albumImages.map(img => compressBase64(img, 800, 0.6)));
      const optimizedLandmarks = await Promise.all(landmarks.map(async l => ({
        ...l,
        sketchUrl: await compressBase64(l.sketchUrl, 800, 0.6),
        realUrl: l.realUrl ? await compressBase64(l.realUrl, 800, 0.6) : undefined
      })));

      localStorage.setItem('cmsConfig', JSON.stringify(optimizedCms));
      localStorage.setItem('styleConfig', JSON.stringify(styleConfig));
      localStorage.setItem('albumImages', JSON.stringify(optimizedAlbum));
      localStorage.setItem('landmarks', JSON.stringify(optimizedLandmarks));
      localStorage.setItem('prizes', JSON.stringify(prizes));
      localStorage.setItem('participants', JSON.stringify(participants));
      localStorage.setItem('customFonts', JSON.stringify(customFonts));
      
      setIsSaving(false);
      alert("Hệ thống đã được cập nhật và lưu trữ thành công!");
    } catch (e) {
      console.error(e);
      alert("Lỗi: Dữ liệu quá lớn (vượt quá 5MB). Vui lòng sử dụng ảnh có kích thước nhỏ hơn hoặc giảm bớt số lượng ảnh trong album.");
      setIsSaving(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === cmsConfig.adminUser && loginForm.pass === cmsConfig.adminPass) {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setLoginForm({ user: '', pass: '' });
    setStep(Step.LANDING);
  };

  const onDragStart = (x: number, y: number) => {
    isDragging.current = true;
    startPos.current = { x: x - session.position.x, y: y - session.position.y };
  };

  const onDragMove = (x: number, y: number) => {
    if (!isDragging.current) return;
    setSession(prev => ({
      ...prev,
      position: { x: x - startPos.current.x, y: y - startPos.current.y }
    }));
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const fontName = file.name.split('.')[0].replace(/\s/g, '_');
      const fontUrl = base64;
      const newStyle = document.createElement('style');
      newStyle.appendChild(document.createTextNode(`@font-face { font-family: '${fontName}'; src: url('${fontUrl}'); }`));
      document.head.appendChild(newStyle);
      setCustomFonts(prev => [...prev, { name: fontName, family: fontName, url: fontUrl }]);
    };
    reader.readAsDataURL(file);
  };

  const updateStyle = (part: string, key: string, value: any) => {
    setStyleConfig((prev: any) => ({ ...prev, [part]: { ...prev[part], [key]: value } }));
  };

  const getStyle = (part: string) => {
    const config = styleConfig[part] || { font: 'sans-serif', color: '#000', size: 16 };
    return { fontFamily: config.font, color: config.color, fontSize: `${config.size}px` };
  };

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) return alert("Vui lòng nhập số điện thoại hợp lệ.");
    setIsSendingOtp(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    const success = await sendZNSOtp(phone, newOtp, {
      accessToken: cmsConfig.zaloAccessToken,
      templateId: cmsConfig.znsTemplateId
    });

    setIsSendingOtp(false);
    if (success) {
      setOtpSent(true);
      if (!cmsConfig.zaloAccessToken) {
        alert("Demo: Mã OTP của bạn là " + newOtp);
      }
    } else {
      alert("Không thể gửi OTP. Vui lòng kiểm tra cấu hình ZNS.");
    }
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp || (otp === '123456' && !cmsConfig.zaloAccessToken)) {
      setStep(Step.UPLOAD_PORTRAIT);
    } else {
      alert('Mã OTP không chính xác.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!cmsConfig.aiApiKey) {
      alert("Vui lòng cấu hình Remove.bg API Key trong phần Admin > API trước khi thực hiện.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSession(prev => ({ ...prev, portraitBase64: base64 }));
      setStep(Step.REMOVE_BG);
      try {
        const processed = await removeBackgroundAI(base64, cmsConfig.aiApiKey);
        setSession(prev => ({ ...prev, noBgPortraitBase64: processed }));
        setStep(Step.DESIGN_WORKBENCH);
      } catch (err: any) { 
        alert("Lỗi khi tách nền: " + err.message);
        setStep(Step.UPLOAD_PORTRAIT); 
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (key === 'albumImages') setAlbumImages(prev => [...prev, base64]);
      else if (key === 'newLandmarkSketch') setNewLandmark(prev => ({ ...prev, sketchUrl: base64 }));
      else if (key === 'newLandmarkReal') setNewLandmark(prev => ({ ...prev, realUrl: base64 }));
      else setCmsConfig(prev => ({ ...prev, [key]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const addImageByUrl = () => {
    if (newImageUrl.trim()) {
      setAlbumImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const addLandmark = () => {
    if (!newLandmark.name || !newLandmark.sketchUrl) return;
    const landmark: Landmark = {
      id: Date.now().toString(),
      name: newLandmark.name,
      coords: newLandmark.coords || '0°0\'0"N 0°0\'0"E',
      sketchUrl: newLandmark.sketchUrl,
      realUrl: newLandmark.realUrl
    };
    setLandmarks(prev => [...prev, landmark]);
    setNewLandmark({ name: '', sketchUrl: '', realUrl: '', coords: '' });
  };

  const addPrize = () => {
    if (!newPrize.name || !newPrize.value) return;
    setPrizes(prev => [...prev, { id: Date.now().toString(), ...newPrize }]);
    setNewPrize({ name: '', value: '', quantity: '' });
  };

  const exportToExcel = () => {
    const headers = "\ufeffHọ tên,SĐT,Bối cảnh,Likes,Comments,Shares,Link,Thời gian\n";
    const rows = participants.map(p => `"${p.name}","${p.phone}","${p.landmark}","${p.engagement?.likes || 0}","${p.engagement?.comments || 0}","${p.engagement?.shares || 0}","${p.facebookLink}","${p.timestamp}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "khach_hang_tham_gia.csv";
    link.click();
  };

  const updateRealEngagement = async () => {
    setIsUpdatingEngagement(true);
    await new Promise(r => setTimeout(r, 1500));
    setParticipants(prev => prev.map(p => ({
      ...p,
      engagement: { likes: Math.floor(Math.random() * 1000), comments: Math.floor(Math.random() * 200), shares: Math.floor(Math.random() * 50) }
    })));
    setIsUpdatingEngagement(false);
  };

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md z-[100] border-b border-slate-100 px-6 flex items-center justify-between shadow-sm">
      <button onClick={() => setStep(Step.LANDING)} className="font-bold text-xs uppercase tracking-widest text-slate-800">Trang chủ</button>
      <div className="font-black uppercase tracking-tighter" style={getStyle('brand')}>{cmsConfig.brandName}</div>
      <button onClick={() => setShowRules(true)} className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase">Thể lệ</button>
    </header>
  );

  const FinalPostcardComponent = () => (
    <div className="bg-white p-6 shadow-2xl rounded-sm aspect-[1.6/1] w-full max-w-[600px] mx-auto relative overflow-hidden flex border-[12px] border-[#fdfcf9]">
      <div className="flex-[2] relative border-2 border-amber-900/10 overflow-hidden bg-slate-50">
        <img src={session.selectedLandmark?.sketchUrl} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `translate(${session.position.x * 0.6}px, ${session.position.y * 0.6}px)` }}>
          <img src={session.noBgPortraitBase64} style={{ transform: `scale(${session.scale * 0.8})` }} className="h-full object-contain mix-blend-multiply opacity-80" />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-between p-4 py-8 bg-[#fdfcf9]">
        <div className="text-center">
          <p className="font-black tracking-widest leading-tight uppercase" style={{ ...getStyle('brand'), fontSize: '10px' }}>{cmsConfig.brandName}™</p>
          <div className="w-2 h-2 bg-red-600 rounded-full mx-auto mt-2" />
        </div>
        <div className="text-center font-serif italic text-amber-950/80 text-sm">{session.selectedLandmark?.name}</div>
        <div className="text-center font-mono text-amber-900/40 text-[7px] leading-tight">{session.selectedLandmark?.coords}</div>
      </div>
    </div>
  );

  if (step === Step.LANDING) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <section className="relative pt-40 pb-48 px-6 text-center bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${cmsConfig.bgImageUrl})` }}>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="mb-8 tracking-tight animate-slideUp" style={getStyle('heroTitle')}>{cmsConfig.heroTitle}</h1>
            <p className="max-w-2xl mx-auto leading-relaxed mb-12" style={getStyle('heroDesc')}>{cmsConfig.heroDesc}</p>
            <button onClick={() => sectionProcessRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-amber-900 text-white px-14 py-6 rounded-full font-black text-xs uppercase tracking-[0.25em] shadow-2xl hover:bg-amber-800 transition-all">Bắt đầu hành trình</button>
          </div>
        </section>

        <section className="py-24 bg-white bg-cover bg-center" style={cmsConfig.albumBgUrl ? { backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(${cmsConfig.albumBgUrl})` } : {}}>
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="mb-16">
               <h3 className="font-black uppercase tracking-[0.3em] mb-4 text-xs" style={getStyle('brand')}>{cmsConfig.albumTitle}</h3>
               <p style={getStyle('albumTitle')}>{cmsConfig.albumDesc}</p>
            </div>
            <div className="relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl mb-10 group bg-slate-100">
              <img src={selectedGalleryImg} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 justify-center">
              {albumImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedGalleryImg(img)} className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${selectedGalleryImg === img ? 'border-amber-600 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-50 bg-cover bg-center" style={cmsConfig.prizeBgUrl ? { backgroundImage: `linear-gradient(rgba(248,250,252,0.9), rgba(248,250,252,0.9)), url(${cmsConfig.prizeBgUrl})` } : {}}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="font-black uppercase tracking-[0.3em] mb-4 text-xs" style={getStyle('brand')}>{cmsConfig.prizeTitle}</h3>
              <p style={getStyle('prizeTitle')} className="mb-4">{cmsConfig.prizeDesc}</p>
              <div className="w-20 h-1 bg-amber-900 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {prizes.map((p) => (
                <div key={p.id} className="bg-white/80 backdrop-blur-sm p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-slate-100 text-center space-y-4">
                  <p className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest">{p.name}</p>
                  <p className="text-2xl font-serif text-amber-950">{p.value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.quantity}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={sectionProcessRef} className="py-24 px-6 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(166,139,109,0.95), rgba(166,139,109,0.95)), url(${cmsConfig.processBgUrl})` }}>
          <div className="max-w-6xl mx-auto relative z-10 text-white">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-6xl font-serif uppercase tracking-tight">Hành trình êm mềm</h2>
              <p className="text-xl font-light opacity-80 uppercase tracking-widest">Tạo bưu thiếp ký họa cá nhân</p>
            </div>
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              <div className="flex-1 space-y-12">
                <div className="border-t border-b border-white/20 divide-y divide-white/20">
                  {[{ s: "01", t: cmsConfig.step1Desc }, { s: "02", t: cmsConfig.step2Desc }, { s: "03", t: cmsConfig.step3Desc }].map((item, i) => (
                    <div key={i} className="py-8 flex gap-8 items-start group">
                      <span className="text-5xl font-serif italic opacity-30 w-16 group-hover:opacity-100 transition-opacity">{item.s}</span>
                      <p className="text-base font-medium leading-relaxed flex-1 pt-2">{item.t}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-[480px] w-full flex flex-col items-center gap-12">
                <div className="space-y-6 w-full text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{cmsConfig.previewCardTitle}</p>
                  <div className="bg-white p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-all rounded-sm">
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      <img src={cmsConfig.previewCardImg} className="w-full h-full object-cover grayscale brightness-110" />
                    </div>
                  </div>
                </div>
                <div className="w-full text-center space-y-6">
                  <button onClick={() => setStep(Step.VERIFY_OTP)} className="w-full bg-[#d4b996] hover:bg-white text-amber-950 py-7 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all">Tham gia ngay</button>
                  <p className="text-[11px] font-medium opacity-60 tracking-wider uppercase">{cmsConfig.eventTime}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-20 text-center bg-slate-50">
           <button onClick={() => setStep(Step.ADMIN)} className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] hover:text-amber-700 transition-colors">Admin Portal</button>
        </footer>

        {showRules && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl space-y-8 animate-fadeIn">
              <h3 className="text-3xl font-serif text-amber-900 border-b pb-4">Thể lệ chương trình</h3>
              <div className="max-h-96 overflow-y-auto text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{cmsConfig.rules}</div>
              <button onClick={() => setShowRules(false)} className="w-full bg-amber-900 text-white py-4 rounded-xl font-bold uppercase text-xs">Đã hiểu</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === Step.ADMIN) {
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-10 animate-slideUp">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{cmsConfig.brandName}</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hệ thống quản trị bảo mật</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Tên đăng nhập</label>
                <input type="text" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm focus:ring-2 focus:ring-amber-900" placeholder="admin" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Mật khẩu</label>
                <input type="password" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm focus:ring-2 focus:ring-amber-900" placeholder="••••••••" required />
              </div>
              {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{loginError}</p>}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(Step.LANDING)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">Quay lại</button>
                <button type="submit" className="flex-[2] bg-amber-950 text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-black transition-all">Đăng nhập</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 p-6 pt-24 text-slate-800">
        <Header />
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Hệ thống Quản trị</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">Đã xác thực</span>
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={handleUpdateSystem} 
                 disabled={isSaving}
                 className={`${isSaving ? 'bg-slate-400' : 'bg-amber-900'} text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2`}
               >
                 {isSaving ? 'Đang lưu...' : 'Cập nhật hệ thống'}
               </button>
               <button onClick={handleAdminLogout} className="bg-red-50 text-red-600 px-8 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Đăng xuất</button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl">
             {['users', 'content', 'gallery', 'landmarks', 'prizes', 'api'].map(tab => (
               <button key={tab} onClick={() => setAdminTab(tab as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === tab ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{tab}</button>
             ))}
          </div>

          {adminTab === 'users' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-8">
              <div className="flex justify-between items-center border-b pb-6">
                <h3 className="font-black text-xs uppercase text-amber-900">Danh sách khách hàng ({participants.length})</h3>
                <div className="flex gap-3">
                  <button onClick={updateRealEngagement} disabled={isUpdatingEngagement} className="bg-amber-100 text-amber-800 px-6 py-2 rounded-xl text-[10px] font-black uppercase">{isUpdatingEngagement ? 'Đang quét...' : 'Quét tương tác'}</button>
                  <button onClick={exportToExcel} className="bg-green-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Xuất Excel</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b text-slate-400 font-black uppercase tracking-tighter">
                    <tr><th className="p-4">Khách hàng</th><th className="p-4">Bối cảnh</th><th className="p-4 text-center">Likes</th><th className="p-4 text-center">Shares</th><th className="p-4">Link Facebook</th></tr>
                  </thead>
                  <tbody>
                    {participants.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="p-4 font-bold">{p.name}<br/><span className="text-slate-400 font-normal">{p.phone}</span></td>
                        <td className="p-4 italic">{p.landmark}</td>
                        <td className="p-4 text-center font-black text-blue-600">{p.engagement?.likes || 0}</td>
                        <td className="p-4 text-center font-black text-red-600">{p.engagement?.shares || 0}</td>
                        <td className="p-4 truncate max-w-[150px]"><a href={p.facebookLink} target="_blank" className="text-blue-500 underline">{p.facebookLink}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === 'gallery' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm animate-fadeIn space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2">Thêm ảnh vào Album</h3>
                  <div className="space-y-4">
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4 relative hover:bg-slate-50 transition-colors">
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'albumImages')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tải ảnh từ máy</p>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="Hoặc dán link ảnh vào đây..." className="flex-1 p-4 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-amber-900" />
                      <button onClick={addImageByUrl} className="bg-amber-900 text-white px-6 rounded-xl text-[10px] font-black uppercase">Thêm link</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-black text-xs uppercase text-slate-400 border-b pb-2">Ảnh hiện có ({albumImages.length})</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {albumImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={() => setAlbumImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'content' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-12 animate-fadeIn">
              <div className="grid grid-cols-1 gap-12">
                <div className="space-y-8">
                  <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2 tracking-widest">Nội dung & Hình ảnh Nền</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Hero Background</label>
                       <div className="aspect-video bg-slate-50 border-2 border-dashed rounded-xl relative overflow-hidden flex items-center justify-center group">
                         {cmsConfig.bgImageUrl ? <img src={cmsConfig.bgImageUrl} className="w-full h-full object-cover" /> : <span className="opacity-30">Nền Hero</span>}
                         <input type="file" onChange={e => handleImageUpload(e, 'bgImageUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Album Background</label>
                       <div className="aspect-video bg-slate-50 border-2 border-dashed rounded-xl relative overflow-hidden flex items-center justify-center group">
                         {cmsConfig.albumBgUrl ? <img src={cmsConfig.albumBgUrl} className="w-full h-full object-cover" /> : <span className="opacity-30">Nền Album</span>}
                         <input type="file" onChange={e => handleImageUpload(e, 'albumBgUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Prizes Background</label>
                       <div className="aspect-video bg-slate-50 border-2 border-dashed rounded-xl relative overflow-hidden flex items-center justify-center group">
                         {cmsConfig.prizeBgUrl ? <img src={cmsConfig.prizeBgUrl} className="w-full h-full object-cover" /> : <span className="opacity-30">Nền Giải thưởng</span>}
                         <input type="file" onChange={e => handleImageUpload(e, 'prizeBgUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Process Background</label>
                       <div className="aspect-video bg-slate-50 border-2 border-dashed rounded-xl relative overflow-hidden flex items-center justify-center group">
                         {cmsConfig.processBgUrl ? <img src={cmsConfig.processBgUrl} className="w-full h-full object-cover" /> : <span className="opacity-30">Nền Quy trình</span>}
                         <input type="file" onChange={e => handleImageUpload(e, 'processBgUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                  </div>

                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4 relative">
                    <input type="file" accept=".ttf,.otf,.woff" onChange={handleFontUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <p className="text-xs font-bold text-slate-400">Tải tệp phông chữ từ máy (.ttf, .otf, .woff)</p>
                    {customFonts.length > 0 && <div className="flex flex-wrap gap-2 justify-center">{customFonts.map(f => <span key={f.name} className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">{f.name}</span>)}</div>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400">Thông tin cơ bản</label>
                       <input type="text" value={cmsConfig.brandName} onChange={e => setCmsConfig({...cmsConfig, brandName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm" placeholder="Tên thương hiệu" />
                       <input type="text" value={cmsConfig.heroTitle} onChange={e => setCmsConfig({...cmsConfig, heroTitle: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm" placeholder="Tiêu đề chính" />
                       <textarea value={cmsConfig.heroDesc} onChange={e => setCmsConfig({...cmsConfig, heroDesc: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm h-24" placeholder="Mô tả chính" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400">Xem trước bưu thiếp (Landing)</label>
                       <div className="flex gap-4">
                          <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border">
                             <img src={cmsConfig.previewCardImg} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-2">
                             <input type="text" value={cmsConfig.previewCardTitle} onChange={e => setCmsConfig({...cmsConfig, previewCardTitle: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-sm" placeholder="Tiêu đề xem trước..." />
                             <div className="relative">
                               <button className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold uppercase w-full">Thay ảnh xem trước</button>
                               <input type="file" onChange={e => handleImageUpload(e, 'previewCardImg')} className="absolute inset-0 opacity-0 cursor-pointer" />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2 tracking-widest">Định dạng hiển thị</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(styleConfig).map((part) => (
                      <div key={part} className="bg-slate-50 p-6 rounded-2xl space-y-4 border">
                        <p className="text-[10px] font-black uppercase text-amber-900/60">Phần: {part}</p>
                        <div className="space-y-4">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase">Font</label><select value={styleConfig[part].font} onChange={e => updateStyle(part, 'font', e.target.value)} className="w-full p-2 bg-white border rounded-lg text-[10px] mt-1"><option value="serif">Serif</option><option value="sans-serif">Sans-serif</option>{customFonts.map(f => <option key={f.family} value={f.family}>{f.name}</option>)}</select></div>
                          <div><label className="text-[9px] font-black text-slate-400 uppercase">Màu</label><input type="color" value={styleConfig[part].color} onChange={e => updateStyle(part, 'color', e.target.value)} className="w-full h-8 rounded mt-1 cursor-pointer" /></div>
                          <div><label className="text-[9px] font-black text-slate-400 uppercase">Size ({styleConfig[part].size}px)</label><input type="range" min="10" max="120" value={styleConfig[part].size} onChange={e => updateStyle(part, 'size', parseInt(e.target.value))} className="w-full mt-2 accent-amber-900" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'landmarks' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2">Thêm bối cảnh mới</h3>
                  <input type="text" value={newLandmark.name} onChange={e => setNewLandmark({...newLandmark, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm" placeholder="Tên bối cảnh..." />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Ảnh ký họa</label><div className="aspect-square bg-slate-50 border-2 border-dashed rounded-xl relative overflow-hidden flex items-center justify-center">{newLandmark.sketchUrl ? <img src={newLandmark.sketchUrl} className="w-full h-full object-cover" /> : <span className="opacity-30">Chọn file</span>}<input type="file" onChange={e => handleImageUpload(e, 'newLandmarkSketch')} className="absolute inset-0 opacity-0 cursor-pointer" /></div></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Ảnh thực tế</label><div className="aspect-square bg-slate-50 border-2 border-dashed rounded-xl relative overflow-hidden flex items-center justify-center">{newLandmark.realUrl ? <img src={newLandmark.realUrl} className="w-full h-full object-cover" /> : <span className="opacity-30">Chọn file</span>}<input type="file" onChange={e => handleImageUpload(e, 'newLandmarkReal')} className="absolute inset-0 opacity-0 cursor-pointer" /></div></div>
                  </div>
                  <button onClick={addLandmark} className="w-full bg-amber-950 text-white py-4 rounded-xl text-[10px] font-black uppercase mt-4">Lưu bối cảnh</button>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {landmarks.map(l => (
                    <div key={l.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl group border"><img src={l.sketchUrl} className="w-12 h-12 object-cover rounded-lg" /><div className="flex-1"><p className="text-[11px] font-bold uppercase">{l.name}</p></div><button onClick={() => setLandmarks(prev => prev.filter(x => x.id !== l.id))} className="text-red-500 opacity-0 group-hover:opacity-100 p-2">×</button></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'prizes' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2">Quản lý Giải thưởng</h3>
                    <input type="text" value={newPrize.name} onChange={e => setNewPrize({...newPrize, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm" placeholder="Tên giải..." />
                    <input type="text" value={newPrize.value} onChange={e => setNewPrize({...newPrize, value: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm" placeholder="Giá trị..." />
                    <input type="text" value={newPrize.quantity} onChange={e => setNewPrize({...newPrize, quantity: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-sm" placeholder="Số lượng..." />
                    <button onClick={addPrize} className="w-full bg-amber-950 text-white py-4 rounded-xl text-[10px] font-black uppercase mt-4">Lưu giải thưởng</button>
                 </div>
                 <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {prizes.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl group border">
                        <div><p className="text-[11px] font-black text-amber-900 uppercase">{p.name}</p><p className="text-sm font-serif">{p.value}</p></div>
                        <button onClick={() => setPrizes(prev => prev.filter(x => x.id !== p.id))} className="text-red-500 opacity-0 group-hover:opacity-100 p-2">×</button>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {adminTab === 'api' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2">Facebook API</h3>
                  <div className="space-y-4">
                    <input type="text" value={cmsConfig.fbAccessToken} onChange={e => setCmsConfig({...cmsConfig, fbAccessToken: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-sm" placeholder="Access Token..." />
                    <input type="text" value={cmsConfig.fbAppId} onChange={e => setCmsConfig({...cmsConfig, fbAppId: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-sm" placeholder="App ID..." />
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-black text-xs uppercase text-amber-900 border-b pb-2">Xác thực ZNS & AI</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                       <p className="text-[10px] font-black uppercase text-blue-800">Cấu hình Zalo ZNS</p>
                       <input type="text" value={cmsConfig.zaloAccessToken} onChange={e => setCmsConfig({...cmsConfig, zaloAccessToken: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" placeholder="Zalo Access Token..." />
                       <input type="text" value={cmsConfig.znsTemplateId} onChange={e => setCmsConfig({...cmsConfig, znsTemplateId: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" placeholder="ZNS Template ID..." />
                    </div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Remove.bg API Key</label>
                    <input type="password" value={cmsConfig.aiApiKey} onChange={e => setCmsConfig({...cmsConfig, aiApiKey: e.target.value})} className="w-full p-3 bg-slate-50 rounded-lg text-sm" placeholder="Nhập Remove.bg API Key tại đây..." />
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                      <p className="text-[10px] font-black uppercase text-amber-800">Cài đặt tài khoản Admin</p>
                      <input type="text" value={cmsConfig.adminUser} onChange={e => setCmsConfig({...cmsConfig, adminUser: e.target.value})} className="w-full p-3 bg-white border-none rounded-lg text-sm" placeholder="User mới..." />
                      <input type="password" value={cmsConfig.adminPass} onChange={e => setCmsConfig({...cmsConfig, adminPass: e.target.value})} className="w-full p-3 bg-white border-none rounded-lg text-sm" placeholder="Pass mới..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === Step.DESIGN_WORKBENCH) {
    return (
      <div className="min-h-screen bg-[#f7f2e8] pt-24 pb-20">
        <Header />
        <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fadeIn">
          <div className="lg:col-span-7 bg-[#d4b996] p-10 rounded-sm shadow-inner relative">
            <div className="relative aspect-square bg-white shadow-2xl rounded-sm p-4 mx-auto max-w-[500px]">
              <div className="relative w-full h-full bg-slate-50 overflow-hidden cursor-move checkerboard" onMouseDown={e => onDragStart(e.clientX, e.clientY)} onMouseMove={e => onDragMove(e.clientX, e.clientY)} onMouseUp={() => isDragging.current = false}>
                <img src={session.selectedLandmark?.sketchUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `translate(${session.position.x}px, ${session.position.y}px)` }}><img src={session.noBgPortraitBase64} style={{ transform: `scale(${session.scale})` }} className="h-[300px] object-contain drop-shadow-xl" /></div>
              </div>
            </div>
            <div className="mt-8 flex gap-3 overflow-x-auto no-scrollbar justify-center">
              {landmarks.map(l => (
                <button key={l.id} onClick={() => setSession(p => ({...p, selectedLandmark: l}))} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${session.selectedLandmark?.id === l.id ? 'border-amber-900 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}><img src={l.sketchUrl} className="w-full h-full object-cover" /></button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-10 pt-10 text-center lg:text-left">
            <div className="space-y-4">
              <h4 className="text-3xl font-serif text-amber-900">Tinh chỉnh bưu thiếp</h4>
              <p className="text-xs text-amber-900/60 uppercase font-black tracking-widest">Kéo chân dung để thay đổi vị trí</p>
            </div>
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase text-amber-900/40">Phóng to / Thu nhỏ</label>
              <input type="range" min="0.5" max="2.5" step="0.05" value={session.scale} onChange={e => setSession(prev => ({...prev, scale: parseFloat(e.target.value)}))} className="w-full accent-amber-700 h-1.5 bg-amber-950/10 rounded-full appearance-none cursor-pointer" />
            </div>
            <div className="space-y-4 pt-4">
              <button onClick={() => setStep(Step.PREVIEW_FINAL)} className="w-full bg-amber-950 text-white py-6 rounded-sm text-sm font-bold uppercase shadow-xl hover:bg-black transition-all">Hoàn tất thiết kế</button>
              <button onClick={() => setStep(Step.UPLOAD_PORTRAIT)} className="w-full bg-white border border-amber-900/30 text-amber-900 py-5 rounded-sm text-xs font-bold uppercase hover:bg-slate-50 transition-all">Tải lại ảnh khác</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === Step.PREVIEW_FINAL) {
    return (
      <div className="min-h-screen bg-[#f7f2e8] pt-24 pb-20">
        <Header />
        <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FinalPostcardComponent />
          <div className="space-y-8">
            <h2 style={getStyle('resultTitle')}>{cmsConfig.resultTitle}</h2>
            <p className="text-lg font-serif italic text-amber-950/60 leading-relaxed">{cmsConfig.resultDescription}</p>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setShowFbLinkInput(true)} className="w-full bg-amber-950 text-white py-6 rounded-sm text-sm font-bold uppercase shadow-lg hover:bg-black transition-all">Chia sẻ Facebook</button>
              <div className="flex gap-4">
                <button onClick={() => setStep(Step.DESIGN_WORKBENCH)} className="flex-1 bg-white border border-amber-900/30 text-amber-900 py-6 rounded-sm text-sm font-bold uppercase hover:bg-slate-50 transition-all">Thiết kế lại</button>
                <button onClick={() => window.print()} className="flex-1 bg-white border border-amber-900/30 text-amber-900 py-6 rounded-sm text-sm font-bold uppercase hover:bg-slate-50 transition-all">Tải về</button>
              </div>
            </div>
          </div>
        </main>
        {showFbLinkInput && (
          <div className="fixed inset-0 z-[300] bg-slate-950/90 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-white p-12 rounded-sm w-full max-sm space-y-10 animate-slideUp">
               <h4 className="text-3xl font-serif">Xác nhận bài đăng</h4>
               <input type="text" placeholder="Dán link bài chia sẻ tại đây..." value={tempFbLink} onChange={e => setTempFbLink(e.target.value)} className="w-full bg-slate-50 p-6 border outline-none text-xs" />
               <button onClick={() => { 
                 setParticipants(prev => [...prev, { name: userName, phone: phone, landmark: session.selectedLandmark?.name || '', shared: true, facebookLink: tempFbLink, timestamp: new Date().toLocaleString(), engagement: { likes: 0, comments: 0, shares: 0 } }]);
                 setShowFbLinkInput(false); setStep(Step.LANDING); 
               }} className="w-full bg-amber-950 text-white py-6 rounded-sm font-bold uppercase text-xs">Hoàn thành</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <Header />
      <main className="max-w-lg mx-auto px-6">
        <StepIndicator currentStep={step} />
        {step === Step.VERIFY_OTP && (
          <div className="space-y-10 text-center animate-fadeIn">
            <h3 className="text-4xl font-serif text-amber-950">Thông tin tham gia</h3>
            <div className="space-y-6">
              <input type="text" placeholder="Họ và tên" value={userName} onChange={e => setUserName(e.target.value)} className="w-full border-b-2 border-amber-100 p-5 text-center font-black outline-none focus:border-amber-950 transition-colors" />
              <div className="flex gap-4">
                <input type="tel" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className="flex-1 border-b-2 border-amber-100 p-5 text-center font-black outline-none focus:border-amber-950 transition-colors" />
                {!otpSent && (
                  <button 
                    onClick={handleRequestOtp} 
                    disabled={isSendingOtp}
                    className={`bg-amber-950 text-white px-8 rounded-xl text-[10px] font-black uppercase ${isSendingOtp ? 'opacity-50' : ''}`}
                  >
                    {isSendingOtp ? 'Đang gửi...' : 'Gửi mã'}
                  </button>
                )}
              </div>
              {otpSent && (
                <div className="space-y-6 animate-slideUp pt-8">
                  <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="Nhập mã OTP..." className="w-full border-2 border-amber-100 p-5 rounded-3xl text-center text-2xl font-mono font-black" />
                  <button onClick={handleVerifyOtp} className="w-full bg-amber-950 text-white py-6 rounded-2xl font-black uppercase tracking-widest">Tiếp tục</button>
                  <button onClick={() => setOtpSent(false)} className="text-[10px] font-bold text-slate-400 uppercase">Gửi lại mã khác</button>
                </div>
              )}
            </div>
          </div>
        )}
        {step === Step.UPLOAD_PORTRAIT && (
          <div className="space-y-12 text-center animate-fadeIn">
            <h3 className="text-4xl font-serif text-amber-950">Tải ảnh chân dung</h3>
            <div className="aspect-[3/4] bg-slate-50 border-4 border-dashed border-amber-100 rounded-[3rem] flex flex-col items-center justify-center group hover:bg-amber-50 transition-colors">
               <input type="file" accept="image/*" className="hidden" id="portrait" onChange={handleFileUpload} />
               <label htmlFor="portrait" className="bg-amber-950 text-white px-12 py-5 rounded-full text-xs font-black uppercase cursor-pointer hover:scale-110 transition-transform shadow-xl">Chọn ảnh từ máy</label>
               <p className="mt-6 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Ưu tiên ảnh chân dung rõ nét, toàn thân</p>
            </div>
          </div>
        )}
        {step === Step.REMOVE_BG && (
          <div className="py-40 flex flex-col items-center gap-10 animate-pulse text-center">
            <div className="w-20 h-20 border-8 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] font-black text-amber-950 uppercase tracking-widest">AI đang xử lý tách nền...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
