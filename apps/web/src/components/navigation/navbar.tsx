import Logo from "@/assets/logo-amp.svg";

export const Navbar = () => {
  return (
    <nav className="flex items-center gap-4 px-4 h-16 w-full">
      <img src={Logo} alt="AMP Logo" />
    </nav>
  );
};
