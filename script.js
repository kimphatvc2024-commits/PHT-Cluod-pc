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
let busy = false;

function formatVnd(amount) {
  return Number(amount).toLocaleString('vi-VN') + 'đ';
}

function setMessage(element, text) {
  if (element) element.textContent = text;
}

function openModal() {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function openPurchaseModal() {
  purchaseModal.classList.add('show');
  purchaseModal.setAttribute('aria-hidden', 'false');
}

function closePurchaseModal() {
  purchaseModal.classList.remove('show');
  purchaseModal.setAttribute('aria-hidden', 'true');
}

function updateModalQrInfo(planName, price) {
  setMessage(
    $('modalQrAmount'),
    `Số tiền cần chuyển: ${formatVnd(price)}`
  );

  setMessage(
    $('transferMemo'),
    `PHT ${(planName || 'CLOUD PC').toUpperCase()}`
  );
}

function setMode(signup) {
  isSignup = signup;

  $('authTitle').textContent = signup
    ? 'Đăng ký tài khoản'
    : 'Đăng nhập';

  $('authNote').textContent = signup
    ? 'Tạo tài khoản PHT Cluod PC của bạn.'
    : 'Đăng nhập vào hệ thống PHT Cluod PC.';

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
  setMessage($('authMessage'), '');
}

function showEmptyHistory(messageText) {
  const area = $('transactionArea');
  if (!area) return;

  area.replaceChildren();

  const p = document.createElement('p');
  p.className = 'empty-state';
  p.textContent = messageText;

  area.appendChild(p);
}

function createTransactionCard(transaction) {
  const card = document.createElement('article');
  card.className = 'tx-card';

  const details = document.createElement('div');

  const title = document.createElement('strong');
  title.textContent = transaction.plan || 'Cloud PC';

  const date = document.createElement('p');
  date.textContent = transaction.created_at
    ? new Date(transaction.created_at).toLocaleString('vi-VN')
    : '';

  const amount = document.createElement('p');
  amount.textContent = formatVnd(transaction.amount || 0);

  details.append(title, date, amount);

  const status = document.createElement('span');
  const isPaid = transaction.status === 'paid';

  status.className = isPaid ? 'status paid' : 'status';
  status.textContent = isPaid
    ? 'ĐÃ XÁC NHẬN'
    : 'ĐANG CHỜ XÁC NHẬN';

  card.append(details, status);

  return card;
}

async function loadTransactions() {
  const area = $('transactionArea');

  if (!currentUser || !area) {
    showEmptyHistory('Vui lòng đăng nhập để xem lịch sử.');
    return;
  }

  showEmptyHistory('Đang tải lịch sử giao dịch...');

  const { data, error } = await supabase
    .from('transactions')
    .select('id, plan, amount, status, created_at')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    showEmptyHistory('Không thể tải lịch sử giao dịch.');
    console.error(error);
    return;
  }

  area.replaceChildren();

  if (!data || data.length === 0) {
    showEmptyHistory('Bạn chưa có giao dịch nào.');
    return;
  }

  const list = document.createElement('div');
  list.className = 'tx-list';

  data.forEach(item => {
    list.appendChild(createTransactionCard(item));
  });

  area.appendChild(list);
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

// Mở và đóng cửa sổ đăng nhập
$('openLogin').addEventListener('click', openModal);
$('heroLogin').addEventListener('click', openModal);
$('closeLogin').addEventListener('click', closeModal);

modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

// Chuyển đổi đăng nhập / đăng ký
$('switchMode').addEventListener('click', () => {
  setMode(!isSignup);
});

// Đăng ký và đăng nhập
form.addEventListener('submit', async event => {
  event.preventDefault();

  if (busy) return;

  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;
  const confirmPassword = $('authConfirm').value;

  if (isSignup && password !== confirmPassword) {
    setMessage($('authMessage'), 'Mật khẩu xác nhận không khớp.');
    return;
  }

  if (password.length < 6) {
    setMessage($('authMessage'), 'Mật khẩu cần ít nhất 6 ký tự.');
    return;
  }

  busy = true;
  $('authSubmit').disabled = true;
  setMessage($('authMessage'), 'Đang xử lý...');

  try {
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      if (data.session) {
        setMessage($('authMessage'), 'Đăng ký thành công!');
      } else {
        setMessage(
          $('authMessage'),
          'Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản.'
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setMessage($('authMessage'), 'Đăng nhập thành công!');
      form.reset();
      closeModal();
    }
  } catch (error) {
    setMessage(
      $('authMessage'),
      error.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
    );
  } finally {
    busy = false;
    $('authSubmit').disabled = false;
  }
});

// Đăng xuất
$('logoutBtn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    setMessage($('authMessage'), error.message);
    return;
  }

  updateAccount(null);
  closeModal();
});

// Mở cửa sổ mua gói
document.querySelectorAll('.buyBtn').forEach(button => {
  button.addEventListener('click', () => {
    if (!currentUser) {
      openModal();
      setMessage(
        $('authMessage'),
        'Vui lòng đăng nhập trước khi đặt thuê Cloud PC.'
      );
      return;
    }

    selectedPlan = button.dataset.plan;
    selectedPrice = Number(button.dataset.price);

    $('selectedPlan').textContent = selectedPlan;
    $('selectedPrice').textContent = formatVnd(selectedPrice);

    updateModalQrInfo(selectedPlan, selectedPrice);
    setMessage($('purchaseMessage'), '');

    openPurchaseModal();
  });
});

$('closePurchase').addEventListener('click', closePurchaseModal);

purchaseModal.addEventListener('click', event => {
  if (event.target === purchaseModal) {
    closePurchaseModal();
  }
});

// Tạo đơn thuê
$('confirmPurchase').addEventListener('click', async () => {
  if (busy) return;

  if (!currentUser) {
    closePurchaseModal();
    openModal();
    return;
  }

  if (!selectedPlan || !selectedPrice) {
    setMessage($('purchaseMessage'), 'Vui lòng chọn gói thuê.');
    return;
  }

  busy = true;
  $('confirmPurchase').disabled = true;

  setMessage(
    $('purchaseMessage'),
    'Đang tạo đơn hàng...'
  );

  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        plan: selectedPlan,
        amount: selectedPrice,
        status: 'pending'
      });

    if (error) throw error;

    setMessage(
      $('purchaseMessage'),
      'Đã tạo đơn hàng. Đơn đang chờ quản trị viên xác nhận thanh toán.'
    );

    await loadTransactions();
  } catch (error) {
    setMessage(
      $('purchaseMessage'),
      error.message || 'Không thể tạo đơn hàng.'
    );
  } finally {
    busy = false;
    $('confirmPurchase').disabled = false;
  }
});

// Khôi phục phiên đăng nhập
supabase.auth.onAuthStateChange((event, session) => {
  updateAccount(session?.user || null);
});

async function initialize() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Session error:', error);
    return;
  }

  updateAccount(data.session?.user || null);
}

initialize();

