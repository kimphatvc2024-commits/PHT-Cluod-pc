import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://tbguiikouernqlncxjjj.supabase.co',
  'sb_publishable_WKH_oXHo2Ar6i7229OEidw_ZY0xbqsU'
);

const $ = id => document.getElementById(id);

const modal = $('loginModal');
let isSignup = false;

function openModal() {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

$('openLogin').addEventListener('click', openModal);
$('heroLogin').addEventListener('click', openModal);
$('closeLogin').addEventListener('click', closeModal);

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

function setMessage(message) {
  $('authMessage').textContent = message;
}

$('switchMode').addEventListener('click', () => {
  isSignup = !isSignup;
  $('authTitle').textContent = isSignup ? 'Đăng ký' : 'Đăng nhập';
  $('authSubmit').textContent = isSignup ? 'Tạo tài khoản' : 'Đăng nhập';
  $('confirmWrap').hidden = !isSignup;
  $('switchText').childNodes[0].textContent =
    isSignup ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? ';
  $('switchMode').textContent = isSignup ? 'Đăng nhập' : 'Đăng ký';
  setMessage('');
});

$('authForm').addEventListener('submit', async e => {
  e.preventDefault();

  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;

  $('authSubmit').disabled = true;
  setMessage('Đang xử lý...');

  try {
    if (isSignup) {
      if (password !== $('authConfirm').value) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      setMessage('Đăng ký thành công. Kiểm tra email để xác nhận tài khoản.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setMessage('Đăng nhập thành công!');
    }
  } catch (error) {
    setMessage(error.message);
  } finally {
    $('authSubmit').disabled = false;
  }
});

async function updateAccount(user) {
  $('signedArea').hidden = !user;
  $('authForm').hidden = !!user;
  $('switchText').hidden = !!user;

  if (user) {
    $('userEmail').textContent = user.email;
    $('authTitle').textContent = 'Tài khoản của bạn';
  } else {
    $('authTitle').textContent = 'Đăng nhập';
  }
}

$('logoutBtn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    setMessage(error.message);
    return;
  }
  setMessage('Đã đăng xuất.');
});

supabase.auth.onAuthStateChange((_event, session) => {
  updateAccount(session?.user ?? null);
});

const { data } = await supabase.auth.getSession();
updateAccount(data.session?.user ?? null);
