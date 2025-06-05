import React from "react";
import LeftNav from "./LeftNav";
import AppUser from "../Types/AppUser";

interface NavbarProps {
  user: AppUser | null;
  RightComponent: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ user, RightComponent }) => {
  return (
    <nav className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 gap-9">
      <LeftNav user={user} />
      <div className="flex items-center">{RightComponent}</div>
    </nav>
  );
};

export default Navbar;
