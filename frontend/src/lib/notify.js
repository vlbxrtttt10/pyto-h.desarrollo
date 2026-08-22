import { Notify, Confirm } from 'notiflix'

Notify.init({
  position: 'right-top',
  distance: '16px',
  fontFamily: 'inherit',
  fontSize: '14px',
  cssAnimationStyle: 'fade',
  success: { background: '#16a350', notiflixIconColor: '#fff' },
  failure: { background: '#e11d48', notiflixIconColor: '#fff' },
  info: { background: '#4338ca', notiflixIconColor: '#fff' },
})

Confirm.init({
  fontFamily: 'inherit',
  titleColor: '#0f172a',
  messageColor: '#475569',
  okButtonBackground: '#e11d48',
  okButtonColor: '#fff',
  cancelButtonBackground: '#f1f5f9',
  cancelButtonColor: '#334155',
  borderRadius: '12px',
  cssAnimationStyle: 'zoom',
})

export default Notify
export { Confirm }
