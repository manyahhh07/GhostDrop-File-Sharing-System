import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="logo">
          <span className="logo-word">GhostDrop</span>
          <span className="logo-tag">v1.0</span>
        </NavLink>

        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            end
          >
            Upload
          </NavLink>
          <NavLink
            to="/files"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            My Files
          </NavLink>
        </div>
      </div>
    </nav>
  );
}