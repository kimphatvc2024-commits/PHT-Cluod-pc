import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://tbguiikouernqlncxjjj.supabase.co',
  'sb_publishable_WKH_oXHo2Ar6i7229OEidw_ZY0xbqsU'
);

const $ = id => document.getElementById(id);

const modal = $('loginModal');
const form = $('authForm');
const purchaseModal = $('purchaseModal');

let isSignup = false;
let currentUser = null;
let selectedPlan = '';
let selectedPrice = 0;

function message(text) {
  $('authMessage').textContent = text;
}

function openModal() {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function setMode(signup) {
  isSignup = signup;

  $('authTitle').textContent = signup ? 'Đăng ký' : 'Đăng nhập';

  $('authNote').textContent = signup
    ? 'Tạo tài khoản PHT Cluod PC.'
    : 'Đăng nhập tài khoản PHT Cluod PC.';

  $('authSubmit').textContent = signup
    ? 'Tạo tài khoản'
    : 'Đăng nhập';

  $('confirmWrap').hidden = !signup;

  $('switchText').childNodes[0].textContent =
    signup ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? ';

  $('switchMode').textContent =
    signup ? 'Đăng nhập' : 'Đăng ký';

  $('authPassword').value = '';
  $('authConfirm').value = '';
}

function updateAccount(user) {
  currentUser = user;

  $('signedArea').hidden = !user;
  form.hidden = !!user;
  $('switchText').hidden = !!user;

  if (user) {
    $('authTitle').textContent = 'Tài khoản của bạn';
    $('authNote').textContent = 'Bạn đã đăng nhập PHT Cluod PC.';
    $('userEmail').textContent = user.email || '';
    loadTransactions();
  } else {
    setMode(false);
    showEmptyHistory('Vui lòng đăng nhập để xem lịch sử.');
  }
}

// ĐĂNG NHẬP
$('openLogin').addEventListener('click', openModal);
$('heroLogin').addEventListener('click', openModal);
$('closeLogin').addEventListener('click', closeModal);

modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

$('switchMode').addEventListener('click', () => {
  setMode(!isSignup);
  message('');
});

form.addEventListener('submit', async event => {
  event.preventDefault();

  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;

  $('authSubmit').disabled = true;
  message('Đang xử lý...');

  try {
    if (isSignup) {
      if (password !== $('authConfirm').value) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      if (data.session) {
        updateAccount(data.session.user);
        message('Tạo tài khoản thành công!');
      } else {
        setMode(false);
        message(
          'Đăng ký thành công! Hãy kiểm tra email xác nhận.'
        );
      }

    } else {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      updateAccount(data.user);
      message('Đăng nhập thành công!');
    }

  } catch (error) {
    message(error.message || 'Có lỗi xảy ra.');
  } finally {
    $('authSubmit').disabled = false;
  }
});

// ĐĂNG XUẤT
$('logoutBtn').addEventListener('click', async () => {
  $('logoutBtn').disabled = true;

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    updateAccount(null);
    message('Đã đăng xuất thành công.');

  } catch (error) {
    message(error.message || 'Không thể đăng xuất.');
  } finally {
    $('logoutBtn').disabled = false;
  }
});

// MỞ MUA GÓI
document.querySelectorAll('.buyBtn').forEach(button => {
  button.addEventListener('click', () => {
    selectedPlan = button.dataset.plan;
    selectedPrice = Number(button.dataset.price);

    $('selectedPlan').textContent = selectedPlan;
    $('selectedPrice').textContent =
      selectedPrice.toLocaleString('vi-VN') + 'đ';

    $('purchaseMessage').textContent = currentUser
      ? 'Kiểm tra thông tin đơn hàng trước khi tiếp tục.'
      : 'Bạn cần đăng nhập trước khi đặt hàng.';

    purchaseModal.classList.add('show');
    purchaseModal.setAttribute('aria-hidden', 'false');
  });
});

function closePurchase() {
  purchaseModal.classList.remove('show');
  purchaseModal.setAttribute('aria-hidden', 'true');
}

$('closePurchase').addEventListener('click', closePurchase);

purchaseModal.addEventListener('click', event => {
  if (event.target === purchaseModal) closePurchase();
});

// TẠO ĐƠN HÀNG
$('confirmPurchase').addEventListener('click', async () => {
  if (!currentUser) {
    closePurchase();
    openModal();
    message('Đăng nhập để mua gói Cloud PC.');
    return;
  }

  const button = $('confirmPurchase');
  button.disabled = true;
  button.textContent = 'Đang tạo đơn...';

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        plan: selectedPlan,
        amount: selectedPrice,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    $('purchaseMessage').textContent =
      'Đã tạo đơn hàng #' + data.id +
      '. Đơn đang chờ thanh toán.';

    button.textContent = 'Đã tạo đơn hàng';

    await loadTransactions();

  } catch (error) {
    $('purchaseMessage').textContent =
      'Không tạo được đơn hàng: ' + error.message;

    button.textContent = 'Thử lại';
  } finally {
    button.disabled = false;
  }
});

// LỊCH SỬ GIAO DỊCH
function showEmptyHistory(text) {
  const area = $('transactionArea');
  area.replaceChildren();

  const icon = document.createElement('div');
  icon.className = 'qr-icon';
  icon.textContent = '▤';

  const title = document.createElement('strong');
  title.textContent = 'LỊCH SỬ GIAO DỊCH';

  const description = document.createElement('span');
  description.textContent = text;

  area.append(icon, title, description);
}

async function loadTransactions() {
  if (!currentUser) return;

  const area = $('transactionArea');
  area.textContent = 'Đang tải lịch sử giao dịch...';

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, plan, amount, status, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    area.replaceChildren();

    if (!data.length) {
      showEmptyHistory('Bạn chưa có giao dịch nào.');
      return;
    }

    data.forEach(item => {
      const card = document.createElement('article');
      card.className = 'plan';

      const title = document.createElement('h3');
      title.textContent = item.plan;

      const price = document.createElement('div');
      price.className = 'price';
      price.textContent =
        Number(item.amount).toLocaleString('vi-VN') + 'đ';

      const status = document.createElement('p');
      status.textContent =
        item.status === 'paid'
          ? 'Đã thanh toán'
          : 'Đang chờ thanh toán';

      const date = document.createElement('small');
      date.textContent = new Date(item.created_at)
        .toLocaleString('vi-VN');

      card.append(title, price, status, date);
      area.appendChild(card);
    });

  } catch (error) {
    showEmptyHistory('Không tải được lịch sử: ' + error.message);
  }
}

// KHÔI PHỤC PHIÊN ĐĂNG NHẬP
supabase.auth.onAuthStateChange((_event, session) => {
  updateAccount(session?.user ?? null);
});

async function initialize() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    message('Không thể tải phiên đăng nhập: ' + error.message);
    return;
  }

  updateAccount(data.session?.user ?? null);
}

initialize();
    
