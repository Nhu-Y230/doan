import { auth, db, collection, addDoc } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 10;
const VIP_ROWS = ['E', 'F'];
const TAKEN = ['A3', 'A7', 'B2', 'B5', 'C4', 'C8', 'D1', 'D6', 'E3', 'E7', 'F2', 'F9', 'G5', 'H3', 'H8'];

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

function getAvatarText(user) {
    const displayName = user.name || (user.email ? user.email.split('@')[0] : '?');
    const parts = displayName.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord.charAt(0).toUpperCase();
}

function getAvatarColor(user) {
    const key = (user.name || user.email || '?').trim();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
        '#1E88E5', '#00897B', '#43A047', '#F4511E',
        '#FB8C00', '#F6BF26', '#039BE5', '#3949AB'
    ];
    return colors[Math.abs(hash) % colors.length];
}

function getDisplayName(user) {
    const displayName = user.name || (user.email ? user.email.split('@')[0] : 'User');
    const parts = displayName.trim().split(/\s+/);
    return parts.length === 1 ? displayName : parts[parts.length - 1];
}

function updateNavbar() {
    const user = getCurrentUser();
    const navActions = document.querySelector('.hanh_dong_dieu_huong');
    if (!navActions) return;

    if (user) {
        const avatarText = getAvatarText(user);
        const avatarColor = getAvatarColor(user);
        const displayName = getDisplayName(user);
        navActions.innerHTML = `
            <div class="user-avatar-nav" title="${user.name || displayName}" style="background:${avatarColor}">${avatarText}</div>
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
    // FIX: thay confirm() bằng showConfirm() tùy chỉnh — hỗ trợ HTML, đúng theme
    const confirmed = await showConfirm('Bạn muốn đăng xuất không?');
    if (confirmed) {
        try {
            await signOut(auth);
            clearCurrentUser();
            updateNavbar();
            showToast('<img src="images/ban_tay.png" width="20"> Đã đăng xuất thành công.');
        } catch (error) {
            showAlert('Lỗi đăng xuất: ' + error.message);
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
    if (password.length < 6) return { valid: false, message: "<img src='images/dau_x_do.png' width='20'> Mật khẩu phải có ít nhất 6 ký tự (Quy định 3 Con Báo Cinema)." };
    if (!/\d/.test(password)) return { valid: false, message: "<img src='images/dau_x_do.png' width='20'> Mật khẩu phải chứa ít nhất 1 chữ số." };
    return { valid: true };
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
        // FIX: dùng showAlert thay alert() để hiển thị đúng
        showAlert("Vui lòng nhập email và mật khẩu");
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
        showToast(`Xin chào quay trở lại! <img src='images/may_phim.png' width='20'> Đăng nhập thành công.`);
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            // FIX: dùng showAlert thay alert() để ảnh hiển thị được
            showAlert("<img src='images/dau_x_do.png' width='20'> Tài khoản hoặc Mật khẩu không chính xác!");
        } else {
            showAlert("<img src='images/dau_x_do.png' width='20'> Lỗi: " + error.message);
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPass').value;
    const conf = document.getElementById('regConfirm').value;

    if (!name || !email || !pass || !conf) {
        // FIX: dùng showAlert thay alert()
        showAlert('<img src="images/thang_do.png" width="20"> Vui lòng điền đầy đủ thông tin.');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert('<img src="images/dau_x_do.png" width="20"> Email không hợp lệ.');
        return;
    }

    const pwCheck = isStrongPassword(pass);
    if (!pwCheck.valid) {
        // FIX: dùng showAlert thay alert() để ảnh trong message hiển thị được
        showAlert(pwCheck.message);
        return;
    }

    if (pass !== conf) {
        showAlert('<img src="images/dau_x_do.png" width="20"> Xác nhận mật khẩu không khớp.');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        saveCurrentUser({ name: name, email: email, avatar: null });

        closeAuth();
        updateNavbar();
        showToast(`Chào mừng ${name}! Đăng ký thành công <img src='images/hoan_ho.png' width='20'>`);
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            showAlert('<img src="images/dau_x_do.png" width="20"> Email này đã được đăng ký trên hệ thống 3 Con Báo Cinema!');
        } else {
            showAlert('<img src="images/dau_x_do.png" width="20"> Đăng ký thất bại: ' + error.message);
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

// Hiển thị thông báo nhỏ (toast) hỗ trợ HTML/ảnh
function showToast(noiDung) {
    let thongBao = document.getElementById('thong-bao');
    if (!thongBao) {
        thongBao = document.createElement('div');
        thongBao.id = 'thong-bao';
        thongBao.className = 'thong-bao';
        document.body.appendChild(thongBao);
    }
    thongBao.innerHTML = noiDung;
    thongBao.classList.add('hien-thi');
    clearTimeout(thongBao._boDemThoiGian);
    thongBao._boDemThoiGian = setTimeout(() => thongBao.classList.remove('hien-thi'), 3000);
}

// FIX: thay thế alert() bằng hộp thoại tùy chỉnh hỗ trợ HTML/ảnh
function showAlert(msg) {
    let overlay = document.getElementById('cineviet-alert-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cineviet-alert-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';

        const box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e;color:#fff;border-radius:14px;padding:28px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);font-size:15px;line-height:1.7;';

        const msgDiv = document.createElement('div');
        msgDiv.id = 'cineviet-alert-msg';
        msgDiv.style.cssText = 'margin-bottom:20px;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;';

        const btn = document.createElement('button');
        btn.textContent = 'Đóng';
        btn.style.cssText = 'background:#e50914;color:#fff;border:none;border-radius:8px;padding:9px 30px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s;';
        btn.onmouseover = () => btn.style.opacity = '0.85';
        btn.onmouseout = () => btn.style.opacity = '1';
        btn.onclick = () => { overlay.style.display = 'none'; };

        box.appendChild(msgDiv);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    document.getElementById('cineviet-alert-msg').innerHTML = msg;
    overlay.style.display = 'flex';
}

// FIX: thay thế confirm() bằng hộp thoại tùy chỉnh hỗ trợ HTML/ảnh, trả về Promise
function showConfirm(msg) {
    return new Promise((resolve) => {
        let overlay = document.getElementById('cineviet-confirm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'cineviet-confirm-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';

            const box = document.createElement('div');
            box.style.cssText = 'background:#1a1a2e;color:#fff;border-radius:14px;padding:28px 32px;max-width:380px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);font-size:15px;line-height:1.7;';

            const msgDiv = document.createElement('div');
            msgDiv.id = 'cineviet-confirm-msg';
            msgDiv.style.cssText = 'margin-bottom:24px;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;';

            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';

            const btnOk = document.createElement('button');
            btnOk.id = 'cineviet-confirm-ok';
            btnOk.textContent = 'OK';
            btnOk.style.cssText = 'background:#22c55e;color:#fff;border:none;border-radius:8px;padding:9px 30px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s;';
            btnOk.onmouseover = () => btnOk.style.opacity = '0.85';
            btnOk.onmouseout = () => btnOk.style.opacity = '1';

            const btnCancel = document.createElement('button');
            btnCancel.id = 'cineviet-confirm-cancel';
            btnCancel.textContent = 'Huỷ';
            btnCancel.style.cssText = 'background:#444;color:#fff;border:none;border-radius:8px;padding:9px 30px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s;';
            btnCancel.onmouseover = () => btnCancel.style.opacity = '0.85';
            btnCancel.onmouseout = () => btnCancel.style.opacity = '1';

            btnRow.appendChild(btnOk);
            btnRow.appendChild(btnCancel);
            box.appendChild(msgDiv);
            box.appendChild(btnRow);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        }

        document.getElementById('cineviet-confirm-msg').innerHTML = msg;
        overlay.style.display = 'flex';

        const btnOk = document.getElementById('cineviet-confirm-ok');
        const btnCancel = document.getElementById('cineviet-confirm-cancel');

        // Clone để xoá event listener cũ
        const newOk = btnOk.cloneNode(true);
        const newCancel = btnCancel.cloneNode(true);
        btnOk.replaceWith(newOk);
        btnCancel.replaceWith(newCancel);

        newOk.onmouseover = () => newOk.style.opacity = '0.85';
        newOk.onmouseout = () => newOk.style.opacity = '1';
        newCancel.onmouseover = () => newCancel.style.opacity = '0.85';
        newCancel.onmouseout = () => newCancel.style.opacity = '1';

        newOk.onclick = () => { overlay.style.display = 'none'; resolve(true); };
        newCancel.onclick = () => { overlay.style.display = 'none'; resolve(false); };
    });
}

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
        showAlert('Vui lòng chọn ít nhất 1 ghế!');
        return;
    }
    if (!isLoggedIn()) {
        closeModal();
        openAuth('register');
        // FIX: showToast dùng innerHTML nên ảnh hiển thị được
        showToast('<img src="images/thang_do.png" width="20"> Vui lòng đăng nhập để thanh toán!');
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
        // FIX: đổi msg.textContent → msg.innerHTML để ảnh hiển thị được
        msg.innerHTML = `<img src="images/tich_xanh.png" width="20"> Giảm 30%! Tiết kiệm ${discount.toLocaleString('vi-VN')}đ`;
        totalEl.textContent = (base - discount).toLocaleString('vi-VN') + 'đ';
    } else {
        discount = 0;
        msg.style.color = '#e50914';
        // FIX: đổi msg.textContent → msg.innerHTML để ảnh hiển thị được
        msg.innerHTML = `<img src="images/dau_x_do.png" width="20"> Mã không hợp lệ`;
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
    const original = btn.innerHTML;
    // FIX: đổi btn.textContent → btn.innerHTML để ảnh hiển thị được
    btn.innerHTML = '<img src="images/dong_ho_cac.png" width="20"> Đang xử lý...';
    btn.disabled = true;

    const danhSachGhe = [...da_chon].sort().join(', ') || '—';
    const code = 'Bao-' + Math.random().toString(36).substring(2, 10).toUpperCase();
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
        // FIX: console.log không cần HTML, dùng text thuần
        console.log("✅ Đã lưu vé lên 3 CON BÁO CINEMA thành công! Mã:", code);
    } catch (err) {
        console.error("❌ Lỗi 3 CON BÁO CINEMA:", err);
    }

    setTimeout(() => {
        document.getElementById('ticketCode').textContent = code;
        document.getElementById('ghe_ve_id').textContent = danhSachGhe;
        const tenPhimVeEl = document.getElementById('ten_phim_ve_id');
        if (tenPhimVeEl) tenPhimVeEl.textContent = currentMovieTitle || '—';

        goPayStep(3);
        // FIX: đổi lại bằng innerHTML vì original đã lưu innerHTML
        btn.innerHTML = original;
        btn.disabled = false;
        paymentDone = true;
        da_chon.clear();
    }, 1500);
}

window.addEventListener('click', function (e) {
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

document.addEventListener('DOMContentLoaded', function () {
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
            '<span class="genre-tag">' + (d.infoGenre || '') + '</span>' +
            '<span>' + (d.infoDuration || '') + '</span>' +
            '<span class="release-tag">' + (d.infoRelease || '') + '</span>';
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
        card.addEventListener('mouseenter', function (e) {
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
window.openModal = function (movieTitle, moviePoster) {
    if (movieTitle) currentMovieTitle = movieTitle;
    if (moviePoster) currentMoviePoster = moviePoster;
    if (_origOpenModal) _origOpenModal();
    else {
        document.getElementById('hop_thoai').classList.add('open');
        document.body.classList.add('hop_thoai-open');
    }
};

const _origCheckout = typeof checkout === 'function' ? checkout : null;
window.checkout = function () {
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

window.toggleUpsell = function (el, key, price) {
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

    cacMucRap.forEach(function (muc) {
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

document.addEventListener('click', function (e) {
    var li = document.querySelector('.co_menu_con');
    if (li && !li.contains(e.target)) {
        li.classList.remove('dang_mo');
    }
});

window.addEventListener('DOMContentLoaded', function () {
    var selectTP = document.getElementById('loc_thanh_pho_id');
    if (selectTP) {
        selectTP.addEventListener('change', function () {
            locRap(document.getElementById('o_tim_rap_id').value);
        });
    }
});

function chuyenTrangRap(tenRap) {
    const path = window.location.pathname;
    const dangORap = path.includes('/Danhsachrap/');
    const dangOThongTin = path.includes('/Thongtin/');

    let prefix;
    if (dangORap) prefix = '';
    else if (dangOThongTin) prefix = '../Danhsachrap/';
    else prefix = 'Danhsachrap/';

    const bangDinhTuyen = {
        'beta-quang-trung': 'rap1.html',
        'beta-tran-quang-khai': 'rap2.html',
        'beta-ung-van-khiem': 'rap3.html',
        'cinestar-quoc-thanh': 'rap4.html',
        'cgv-vung-tau': 'rap5.html',
        'beta-ha-noi': 'rap6.html',
    };
    const tenFile = bangDinhTuyen[tenRap];
    if (tenFile) window.location.href = prefix + tenFile;
}

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