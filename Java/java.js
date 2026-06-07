// ✅ Sửa đường dẫn: ../firebase.js (vì java.js nằm trong thư mục Java/)
import { auth, db, collection, addDoc } from './firebase.js';
// ✅ Đã sửa version: 10.13.0 → 12.13.0 (khớp với firebase.js)
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 10;
const VIP_ROWS = ['E', 'F'];
const TAKEN = ['A3','A7','B2','B5','C4','C8','D1','D6','E3','E7','F2','F9','G5','H3','H8'];

let da_chon = new Set();
let currentMethod = 'momo';
let discount = 0;
let paymentDone = false; 

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('cineviet_current_user') || 'null');
}

function saveCurrentUser(user) {
    localStorage.setItem('cineviet_current_user', JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem('cineviet_current_user');
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function updateNavbar() {
    const user = getCurrentUser();
    const navActions = document.querySelector('.hanh_dong_dieu_huong');
    if (!navActions) return;

    if (user) {
        navActions.innerHTML = `
            <div class="user-info-nav">
                <div class="user-avatar-nav">${user.avatar || user.name?.charAt(0).toUpperCase() || '?'}</div>
                <span class="user-name-nav">${user.name ? user.name.split(' ').pop() : 'User'}</span>
            </div>
            <button class="nut_dieu_huong_vien" onclick="handleLogout()">Đăng xuất</button>
        `;
    } else {
        navActions.innerHTML = `
            <button class="nut_dieu_huong_vien" onclick="openAuth('login')">Đăng nhập</button>
            <button class="nut_dieu_huong_chinh" onclick="openAuth('register')">Đăng ký</button>
        `;
    }
}

async function handleLogout() {
    if (confirm('Bạn muốn đăng xuất không?')) {
        try {
            await signOut(auth);
            clearCurrentUser();
            updateNavbar();
            showToast('👋 Đã đăng xuất thành công.');
        } catch (error) {
            alert('Lỗi đăng xuất: ' + error.message);
        }
    }
}

function openAuth(tab) {
    const hop_thoai = document.getElementById('hop_thoai_xac_thuc_id');
    if (hop_thoai) {
        hop_thoai.classList.add('open');
        document.body.classList.add('hop_thoai-open');
        switchTab(tab || 'login');
    }
}

function closeAuth() {
    const hop_thoai = document.getElementById('hop_thoai_xac_thuc_id');
    if (hop_thoai) hop_thoai.classList.remove('open');
    document.body.classList.remove('hop_thoai-open');
}

function switchTab(tab) {
    const tL = document.getElementById('tabLogin'), tR = document.getElementById('tabRegister');
    const fL = document.getElementById('formLogin'), fR = document.getElementById('formRegister');
    if (!tL || !tR || !fL || !fR) return;
    tL.classList.toggle('active', tab === 'login');
    tR.classList.toggle('active', tab === 'register');
    fL.style.display = tab === 'login' ? 'flex' : 'none';
    fR.style.display = tab === 'register' ? 'flex' : 'none';
}

function isStrongPassword(password) {
    if (password.length < 6) return { valid: false, message: "❌ Mật khẩu phải có ít nhất 6 ký tự (Quy định Firebase)." };
    if (!/\d/.test(password)) return { valid: false, message: "❌ Mật khẩu phải chứa ít nhất 1 chữ số." };
    return { valid: true };
}

// ===== ĐĂNG NHẬP BẰNG FIREBASE =====
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass  = document.getElementById('loginPass').value;

    if (!email || !pass) {
        alert("Vui lòng nhập email và mật khẩu");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        saveCurrentUser({ 
            name: user.displayName || email.split('@')[0], 
            email: user.email, 
            avatar: null 
        });

        closeAuth();
        updateNavbar();
        showToast(`Xin chào quay trở lại! 🎬`);
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            alert("❌ Tài khoản hoặc Mật khẩu không chính xác!");
        } else {
            alert("❌ Lỗi: " + error.message);
        }
    }
}

// ===== ĐĂNG KÝ BẰNG FIREBASE =====
async function handleRegister(e) {
    e.preventDefault();

    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass  = document.getElementById('regPass').value;
    const conf  = document.getElementById('regConfirm').value;

    if (!name || !email || !pass || !conf) {
        alert('⚠️ Vui lòng điền đầy đủ thông tin.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('❌ Email không hợp lệ.');
        return;
    }

    const pwCheck = isStrongPassword(pass);
    if (!pwCheck.valid) {
        alert(pwCheck.message);
        return;
    }

    if (pass !== conf) {
        alert('❌ Xác nhận mật khẩu không khớp.');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        saveCurrentUser({ name: name, email: email, avatar: null });
        
        closeAuth();
        updateNavbar();
        showToast(`Chào mừng ${name}! Đăng ký thành công 🎉`);
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            alert('❌ Email này đã được đăng ký trên hệ thống Firebase!');
        } else {
            alert('❌ Đăng ký thất bại: ' + error.message);
        }
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
    } else {
        input.type = "password";
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
    }
}

function showToast(msg) {
    let toast = document.getElementById('cineviet-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cineviet-toast';
        toast.className = 'cineviet-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ✅ Đã sửa: xử lý trường hợp pathname là "/" hoặc "" → mặc định là index.html
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    let tenFile = location.pathname.split('/').pop();
    if (!tenFile || tenFile === '') tenFile = 'index.html';
    document.querySelectorAll('nav ul li a').forEach(a => {
        if (a.getAttribute('href') === tenFile) {
            a.classList.add('trang_hien_tai');
        }
    });
});

function openModal() {
    document.getElementById('hop_thoai').classList.add('open');
    document.body.classList.add('hop_thoai-open');
    renderSeats();
}

function closeModal() {
    document.getElementById('hop_thoai').classList.remove('open');
    document.body.classList.remove('hop_thoai-open');
}

function renderSeats() {
    const grid = document.getElementById('seatGrid');
    if (!grid) return;
    grid.innerHTML = '';

    ROWS.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'ghe-row';

        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = row;
        rowEl.appendChild(label);

        for (let c = 1; c <= COLS; c++) {
            if (c === 6) {
                const gap = document.createElement('div');
                gap.className = 'ghe-gap';
                rowEl.appendChild(gap);
            }
            const id = row + c;
            const ghe = document.createElement('div');
            ghe.className = 'ghe';
            if (VIP_ROWS.includes(row)) ghe.classList.add('ghe_vip');
            if (TAKEN.includes(id)) ghe.classList.add('taken');
            else {
                if (da_chon.has(id)) ghe.classList.add('da_chon');
                ghe.dataset.id = id;
                ghe.onclick = toggleSeat;
            }
            rowEl.appendChild(ghe);
        }
        grid.appendChild(rowEl);
    });
    updateSummary();
}

function toggleSeat(e) {
    const id = e.target.dataset.id;
    if (da_chon.has(id)) da_chon.delete(id);
    else da_chon.add(id);
    renderSeats();
}

function updateSummary() {
    const seatsEl = document.getElementById('selectedSeats');
    const priceEl = document.getElementById('totalPrice');
    if (da_chon.size === 0) {
        seatsEl.textContent = 'Chưa chọn';
        priceEl.textContent = '0đ';
        return;
    }
    let total = 0;
    da_chon.forEach(id => total += VIP_ROWS.includes(id[0]) ? 130000 : 90000);
    seatsEl.textContent = [...da_chon].sort().join(', ');
    priceEl.textContent = total.toLocaleString('vi-VN') + 'đ';
}

function checkout() {
    if (da_chon.size === 0) {
        alert('Vui lòng chọn ít nhất 1 ghế!');
        return;
    }
    if (!isLoggedIn()) {
        closeModal();
        openAuth('register');
        showToast('⚠️ Vui lòng đăng nhập để thanh toán!');
        return;
    }
    closeModal();
    openPay();
}

function openPay() {
    const seats = [...da_chon].sort().join(', ');
    let total = 0;
    da_chon.forEach(id => total += VIP_ROWS.includes(id[0]) ? 130000 : 90000);

    document.getElementById('paySeats').textContent = seats || '—';
    document.getElementById('tong_tien_thanh_toan_id').textContent = total.toLocaleString('vi-VN') + 'đ';

    paymentDone = false; 
    goPayStep(1);
    document.getElementById('hop_thoai_thanh_toan_id').classList.add('open');
    document.body.classList.add('hop_thoai-open');
}

function closePay() {
    const hop_thoai_thanh_toan_id = document.getElementById('hop_thoai_thanh_toan_id');
    if (hop_thoai_thanh_toan_id) hop_thoai_thanh_toan_id.classList.remove('open');
    document.body.classList.remove('hop_thoai-open');

    setTimeout(() => {
        goPayStep(1);
        if (!paymentDone) da_chon.clear();
        paymentDone = false;
    }, 300);
}

function goPayStep(n) {
    for (let i = 1; i <= 3; i++) {
        const stepDiv = document.getElementById('payStep' + i);
        const stepHeader = document.getElementById('step' + i);
        if (stepDiv) stepDiv.style.display = (i === n) ? 'block' : 'none';
        if (stepHeader) {
            stepHeader.classList.remove('active', 'done');
            if (i < n) stepHeader.classList.add('done');
            else if (i === n) stepHeader.classList.add('active');
        }
    }
}

function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const msg = document.getElementById('couponMsg');
    const totalEl = document.getElementById('tong_tien_thanh_toan_id');

    let base = 0;
    da_chon.forEach(id => base += VIP_ROWS.includes(id[0]) ? 130000 : 90000);

    msg.style.display = 'block';
    if (code === 'BAOBARA') {
        discount = Math.round(base * 0.3);
        msg.style.color = '#22c55e';
        msg.textContent = `✅ Giảm 30%! Tiết kiệm ${discount.toLocaleString('vi-VN')}đ`;
        totalEl.textContent = (base - discount).toLocaleString('vi-VN') + 'đ';
    } else {
        discount = 0;
        msg.style.color = '#e50914';
        msg.textContent = '❌ Mã không hợp lệ';
    }
}

function selectMethod(el, method) {
    document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('da_chon'));
    el.classList.add('da_chon');
    currentMethod = method;

    const cardForm = document.getElementById('cardForm');
    if (cardForm) cardForm.style.display = (method === 'card') ? 'block' : 'none';
}

async function processPayment(btn) {
    const original = btn.textContent;
    btn.textContent = '⏳ Đang xử lý...';
    btn.disabled = true;

    const danhSachGhe = [...da_chon].sort().join(', ') || '—';
    const code = 'Bao-' + Math.random().toString(36).substring(2,10).toUpperCase();
    const nguoiDung = getCurrentUser();

    try {
        await addDoc(collection(db, "danh_sach_ve_dat"), {
            ma_ve: code,
            ten_phim: currentMovieTitle || "Chưa rõ phim",
            ghe_da_chon: danhSachGhe,
            rap: "CGV Vincom Center",
            phuong_thuc_tt: currentMethod || "momo",
            email_khach: nguoiDung?.email || "khach_vang_lai",
            ten_khach: nguoiDung?.name || "Khách",
            ngay_dat: new Date().toLocaleString('vi-VN'),
            timestamp: new Date().toISOString()
        });
        console.log("🎉 Đã lưu vé lên 3 CON BÁO CINEMA thành công! Mã:", code);
    } catch (err) {
        console.error("❌ Lỗi 3 CON BÁO CINEMA:", err);
    }

    setTimeout(() => {
        document.getElementById('ticketCode').textContent = code;
        document.getElementById('ghe_ve_id').textContent = danhSachGhe;
        const tenPhimVeEl = document.getElementById('ten_phim_ve_id');
        if (tenPhimVeEl) tenPhimVeEl.textContent = currentMovieTitle || '—';

        goPayStep(3);
        btn.textContent = original;
        btn.disabled = false;
        paymentDone = true;
        da_chon.clear();
    }, 1500);
}

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('hop_thoai-overlay') || 
        e.target.classList.contains('auth-overlay') || 
        e.target.classList.contains('pay-overlay')) {
        closeModal();
        closeAuth();
        const pm = document.getElementById('hop_thoai_thanh_toan_id');
        if (pm) pm.classList.remove('open');
        document.body.classList.remove('hop_thoai-open');
    }
});

function filterMovies() {
    const searchText = document.getElementById('o_nhap_tim_kiem_id')?.value.toLowerCase().trim() || '';
    const loc_the_loai_id = document.getElementById('loc_the_loai_id')?.value || '';
    const tagFilter = document.getElementById('tagFilter')?.value || '';

    document.querySelectorAll('#moviesGrid .the_phim').forEach(card => {
        const title = card.getAttribute('data-title')?.toLowerCase() || '';
        const genre = card.getAttribute('data-genre') || '';
        const tag = card.getAttribute('data-tag') || '';

        let show = true;
        if (searchText && !title.includes(searchText)) show = false;
        if (loc_the_loai_id && !genre.includes(loc_the_loai_id)) show = false;
        if (tagFilter && tag !== tagFilter) show = false;

        card.style.display = show ? 'block' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const tooltip = document.getElementById('movieTooltip');
    if (!tooltip) return;

    const OFFSET = 14;
    let hideTimer = null;

    function fillTooltip(card) {
        const d = card.dataset;
        if (!d.infoTitle) return;
        document.getElementById('tooltipTitle').textContent = d.infoTitle;
        document.getElementById('tooltipRating').textContent = d.infoRating || '';
        document.getElementById('tooltipMeta').innerHTML =
            '<span class="genre-tag">' + (d.infoGenre||'') + '</span>' +
            '<span>' + (d.infoDuration||'') + '</span>' +
            '<span class="release-tag">' + (d.infoRelease||'') + '</span>';
        document.getElementById('tooltipDesc').textContent = d.infoDesc || '';
    }

    function moveTooltip(e) {
        const mx = e.clientX;
        const my = e.clientY;
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        const spaceRight = window.innerWidth - mx;
        let left, top;

        if (spaceRight >= tw + OFFSET) {
            left = mx + OFFSET;
        } else {
            left = mx - tw - OFFSET;
        }
        left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));

        top = my + OFFSET;
        if (top + th > window.innerHeight) top = my - th - OFFSET;
        if (top < 8) top = 8;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function hideTooltip() {
        hideTimer = setTimeout(() => tooltip.classList.remove('visible'), 80);
    }

    document.querySelectorAll('.the_phim[data-info-title]').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            clearTimeout(hideTimer);
            fillTooltip(this);
            moveTooltip(e);
            tooltip.classList.add('visible');
        });
        card.addEventListener('mousemove', moveTooltip);
        card.addEventListener('mouseleave', hideTooltip);
    });

    document.body.appendChild(tooltip);
});

let currentMovieTitle = 'Quỷ Dữ Từ Luyện Ngục';
let currentMoviePoster = 'images/quy_du_tu_luyen_nguc.jpg';
let upsellExtras = {}; 
let isNewCustomer = true; 
let baseTicketTotal = 0;

const _origOpenModal = typeof openModal === 'function' ? openModal : null;
window.openModal = function(movieTitle, moviePoster) {
  if (movieTitle) currentMovieTitle = movieTitle;
  if (moviePoster) currentMoviePoster = moviePoster;
  if (_origOpenModal) _origOpenModal();
  else {
    document.getElementById('hop_thoai').classList.add('open');
    document.body.classList.add('hop_thoai-open');
  }
};

const _origCheckout = typeof checkout === 'function' ? checkout : null;
window.checkout = function() {
  upsellExtras = {};
  document.querySelectorAll('.upsell-item').forEach(el => {
    el.classList.remove('da_chon');
    el.querySelector('.upsell-check').textContent = '＋';
  });

  if (_origCheckout) _origCheckout();
  else {
    document.getElementById('hop_thoai_thanh_toan_id').classList.add('open');
    document.body.classList.add('hop_thoai-open');
  }

  setTimeout(() => {
    const posterEl = document.getElementById('payMoviePoster');
    if (posterEl) {
      posterEl.src = currentMoviePoster;
      posterEl.alt = currentMovieTitle;
      posterEl.style.display = 'block';
    }
    const nameEl = document.getElementById('payMovieName');
    if (nameEl) nameEl.textContent = currentMovieTitle;
    const nameRowEl = document.getElementById('payMovieNameRow');
    if (nameRowEl) nameRowEl.textContent = currentMovieTitle;
    const tenPhimVeEl = document.getElementById('ten_phim_ve_id');
    if (tenPhimVeEl) tenPhimVeEl.textContent = currentMovieTitle;

    const bannerEl = document.getElementById('newCustomerBanner');
    if (bannerEl) bannerEl.style.display = isNewCustomer ? 'flex' : 'none';

    syncPayTotal();
  }, 30);
};

function syncPayTotal() {
  const el = document.getElementById('tong_tien_thanh_toan_id');
  if (!el) return;
  const raw = el.textContent.replace(/[^0-9]/g, '');
  baseTicketTotal = parseInt(raw) || 0;
  recalcTotal();
}

function recalcTotal() {
  const el = document.getElementById('tong_tien_thanh_toan_id');
  if (!el) return;
  let extra = Object.values(upsellExtras).reduce((s, v) => s + v, 0);
  let total = baseTicketTotal + extra;
  if (isNewCustomer) total = Math.round(total * 0.85);
  el.textContent = total.toLocaleString('vi-VN') + 'đ';
  if (isNewCustomer) {
    el.style.color = '#22c55e';
  }
}

window.toggleUpsell = function(el, key, price) {
  if (el.classList.contains('da_chon')) {
    el.classList.remove('da_chon');
    el.querySelector('.upsell-check').textContent = '＋';
    delete upsellExtras[key];
  } else {
    el.classList.add('da_chon');
    el.querySelector('.upsell-check').textContent = '✓';
    upsellExtras[key] = price;
  }
  recalcTotal();
};

function formatCard(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function batTatMenuRap(e) {
  e.stopPropagation();
  var li = document.querySelector('.co_menu_con');
  if (li) li.classList.toggle('dang_mo');
}

function locRap(tuKhoa) {
  var thanhPhoChon = document.getElementById('loc_thanh_pho_id').value;
  var cacMucRap = document.querySelectorAll('.muc_rap');
  var kw = tuKhoa.toLowerCase().trim();

  cacMucRap.forEach(function(muc) {
    var tenRap = muc.querySelector('.ten_rap').textContent.toLowerCase();
    var diaChiRap = muc.querySelector('.dia_chi_rap').textContent.toLowerCase();
    var khopThanhPho = thanhPhoChon === '' || muc.getAttribute('data-thanh-pho') === thanhPhoChon;
    var khopTuKhoa = kw === '' || tenRap.includes(kw) || diaChiRap.includes(kw);
    if (khopThanhPho && khopTuKhoa) {
      muc.classList.remove('an_rap');
    } else {
      muc.classList.add('an_rap');
    }
  });
}

document.addEventListener('click', function(e) {
  var li = document.querySelector('.co_menu_con');
  if (li && !li.contains(e.target)) {
    li.classList.remove('dang_mo');
  }
});

window.addEventListener('DOMContentLoaded', function() {
  var selectTP = document.getElementById('loc_thanh_pho_id');
  if (selectTP) {
    selectTP.addEventListener('change', function() {
      locRap(document.getElementById('o_tim_rap_id').value);
    });
  }
});

function chuyenTrangRap(tenRap) {
  const path = window.location.pathname;
  const dangORap     = path.includes('/Danhsachrap/');
  const dangOThongTin = path.includes('/thongtin/');

  let prefix;
  if (dangORap)        prefix = '';                // đang trong Danhsachrap/
  else if (dangOThongTin) prefix = '../Danhsachrap/'; // từ thongtin/ lên root rồi vào Danhsachrap/
  else                 prefix = 'Danhsachrap/';    // từ root

  const bangDinhTuyen = {
    'beta-quang-trung':     'rap1.html',
    'beta-tran-quang-khai': 'rap2.html',
    'beta-ung-van-khiem':   'rap3.html',
    'cinestar-quoc-thanh':  'rap4.html',
    'cgv-vung-tau':         'rap5.html',
    'cgv-ha-noi':           'rap6.html',
  };
  const tenFile = bangDinhTuyen[tenRap];
  if (tenFile) window.location.href = prefix + tenFile;
}

// Gắn các hàm vào window để gọi từ HTML onclick
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.switchTab = switchTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.togglePassword = togglePassword;
window.closeModal = closeModal;
window.closePay = closePay;
window.processPayment = processPayment; 
window.applyCoupon = applyCoupon;
window.selectMethod = selectMethod;
window.batTatMenuRap = batTatMenuRap;
window.locRap = locRap;
window.chuyenTrangRap = chuyenTrangRap;
window.goPayStep = goPayStep;
window.filterMovies = filterMovies;
window.formatCard = formatCard;