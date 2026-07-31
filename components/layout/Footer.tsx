import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export function Footer() {
  return (
    <footer className="bg-[#071421] px-6 py-7 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 font-black">₦</div>
          <span className="font-bold">Task Money</span>
        </div>
        <div className="flex items-center gap-3 text-xl">
          <span className="mr-2 text-sm text-slate-300">Follow us</span>
          <FaFacebook /><FaXTwitter /><FaInstagram /><FaYoutube /><FaTiktok /><FaTelegram /><FaWhatsapp /><FaLinkedin />
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Task Money. All rights reserved.</p>
      </div>
    </footer>
  );
}
