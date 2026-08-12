import Logo from "@/assets/logo-amp.svg";

export const Navbar = () => {
  return (
    <nav className="flex items-center px-4 h-16">
      <img src={Logo} alt="AMP Logo" />
    </nav>
  );
};
