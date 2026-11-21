const modal=document.getElementById('loginModal');
const open=()=>{modal.classList.add('show');modal.setAttribute('aria-hidden','false')};
const close=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true')};
document.getElementById('openLogin').addEventListener('click',open);
document.getElementById('heroLogin').addEventListener('click',open);
document.getElementById('closeLogin').addEventListener('click',close);
modal.addEventListener('click',e=>{if(e.target===modal)close()});
document.getElementById('loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  document.getElementById('loginMessage').textContent='Đây mới là giao diện mẫu. Hệ thống đăng nhập thật cần được kết nối dịch vụ xác thực trước khi sử dụng.';
});
