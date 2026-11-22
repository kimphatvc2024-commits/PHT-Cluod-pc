import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://tbguiikouernqlncxjjj.supabase.co',
  'sb_publishable_WKH_oXHo2Ar6i7229OEidw_ZY0xbqsU'
);

const $ = id => document.getElementById(id);

const modal = $('loginModal');
const form = $('authForm');

let isSignup = false;

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

  $('authTitle').textContent =
    signup ? 'Đăng ký' : 'Đăng nhập';

  $('authNote').textContent =
    signup
      ? 'Tạo tài khoản PHT Cluod PC.'
      : 'Đăng nhập tài khoản PHT Cluod PC.';

  $('authSubmit').textContent =
    signup ? 'Tạo tài khoản' : 'Đăng nhập';

  $('confirmWrap').hidden = !signup;

  $('switchText').childNodes[0].textContent =
    signup ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? ';

  $('switchMode').textContent =
    signup ? 'Đăng nhập' : 'Đăng ký';

  $('authPassword').value = '';
  $('authConfirm').value = '';
}

function updateAccount(user) {
  $('signedArea').hidden = !user;
  form.hidden = !!user;
  $('switchText').hidden = !!user;

  if (user) {
    $('authTitle').textContent = 'Tài khoản của bạn';
    $('authNote').textContent = 'Bạn đã đăng nhập PHT Cluod PC.';
    $('userEmail').textContent = user.email || '';
  } else {
    setMode(false);
  }
}

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
      const confirm = $('authConfirm').value;

      if (password !== confirm) {
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
          'Đăng ký thành công! Hãy kiểm tra email xác nhận, sau đó đăng nhập.'
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
    message(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
  } finally {
    $('authSubmit').disabled = false;
  }
});

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
