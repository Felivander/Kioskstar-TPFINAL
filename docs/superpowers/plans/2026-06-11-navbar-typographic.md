# Minimal Typographic Navbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the top navigation bar to display clean, text-only items with typographic color effects, removing all emojis and background shapes.

**Architecture:** Update `Layout.tsx` to remove emojis from logo, branch pill, desktop navigation, profile dropdown, and mobile navigation. Set navigation links to render in a typographic style: active state has bold text gradient, inactive has soft gray text, and hover transitions to primary color with a micro-translation.

**Tech Stack:** React 19, TailwindCSS 4, React Router Dom

---

### Task 1: Update Navbar Logo and Branch Pill Styles

**Files:**
- Modify: `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\components\Layout.tsx`

- [ ] **Step 1: Replace star emoji with modern "K" logo**

Open `frontend/src/components/Layout.tsx`. Find the logo container (around line 34-37):
```tsx
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-primary-500/20 animate-glow">
              K
            </div>
```
Ensure it matches the minimalist text "K" without emojis or icons.

- [ ] **Step 2: Remove pin emoji from branch pill**

Find the branch container (around line 44-49):
```tsx
          {selectedBranch && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 text-xs font-semibold text-surface-600 border border-surface-200/40">
              <span className="truncate max-w-[150px]">{selectedBranch.name}</span>
            </div>
          )}
```
Ensure it has no `<span>📍</span>` or pin icon.

---

### Task 2: Update Desktop NavLinks Styling to Minimal Typographic Style

**Files:**
- Modify: `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\components\Layout.tsx`

- [ ] **Step 1: Replace desktop NavLink render styles**

Find the desktop navigation list map block (around line 53-69):
```tsx
        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5" role="navigation">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-100/50'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
```
Replace the className and elements inside with:
```tsx
        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2" role="navigation">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm transition-all duration-300 hover:-translate-y-[0.5px]
                ${isActive
                  ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
                  : 'font-medium text-surface-500 hover:text-primary-600'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
```

---

### Task 3: Update Profile Dropdown Submenu Styling

**Files:**
- Modify: `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\components\Layout.tsx`

- [ ] **Step 1: Verify profile dropdown contains no emojis**

Find the dropdown menu (around line 93-128) and ensure the buttons do not contain `<span>📊</span>`, `<span>🏪</span>`, or `<span>👤</span>`.
```tsx
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-surface-200 shadow-xl py-1.5 z-20 animate-scale-in">
                  <button
                    onClick={() => { navigate('/dashboard'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors flex items-center gap-2"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { navigate('/dashboard'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors flex items-center gap-2"
                  >
                    Mi Kiosco
                  </button>
                  
                  <div className="border-t border-surface-150 my-1" />
                  
                  <button
                    onClick={() => { alert('Gestión de cuenta en desarrollo'); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors flex items-center gap-2"
                  >
                    Cuenta
                  </button>
                  
                  <div className="border-t border-surface-150 my-1" />
                  
                  <button
                    onClick={() => { handleLogout(); setProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Salir
                  </button>
                </div>
```

---

### Task 4: Update Mobile Menu Dropdown Styling

**Files:**
- Modify: `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\components\Layout.tsx`

- [ ] **Step 1: Replace mobile NavLink render styles**

Find the mobile menu dropdown (around line 150-213) and ensure it has no emoji icons for Dashboard, Mi Kiosco, Cuenta, and filtered nav items. Update NavLink items to be clean typographic styles matching Task 2.
```tsx
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-md border-b border-surface-200/80 shadow-lg z-30 py-3 px-4 flex flex-col gap-1.5 animate-fade-in-up">
          {/* Quick Access Submenu */}
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive ? 'bg-primary-50 text-primary-600' : 'text-surface-600 hover:bg-surface-50'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
          >
            Mi Kiosco
          </NavLink>
          <button
            onClick={() => { alert('Gestión de cuenta en desarrollo'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-50 text-left w-full transition-colors"
          >
            Cuenta
          </button>

          <div className="border-t border-surface-150 my-1.5" />

          {/* Filtered Navigation */}
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-surface-600 hover:bg-surface-50'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
```
Replace the list mapping and submenu link styles with minimal typographic styling:
```tsx
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-md border-b border-surface-200/80 shadow-lg z-30 py-4 px-6 flex flex-col gap-2.5 animate-fade-in-up">
          {/* Quick Access Submenu */}
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `text-sm transition-all duration-300 py-1.5
              ${isActive
                ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
                : 'font-medium text-surface-500'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-surface-500 py-1.5 transition-colors"
          >
            Mi Kiosco
          </NavLink>
          <button
            onClick={() => { alert('Gestión de cuenta en desarrollo'); setMobileMenuOpen(false); }}
            className="text-sm font-medium text-surface-500 py-1.5 text-left w-full transition-colors"
          >
            Cuenta
          </button>

          <div className="border-t border-surface-150 my-1.5" />

          {/* Filtered Navigation */}
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm transition-all duration-300 py-1.5
                ${isActive
                  ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600'
                  : 'font-medium text-surface-500'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
```

---

### Task 5: Verify Build and Commit

**Files:**
- Modify: `c:\Users\feliv\Documents\Kioskstar-TPFINAL\frontend\src\components\Layout.tsx`

- [ ] **Step 1: Verify compilation build**

Run build:
`cmd.exe /c "set PATH=%PATH%;C:\Program Files\nodejs&& npm run build"`
Expected output: Compilation success (vite build completes successfully).

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: implement minimal typographic style for top navbar"
```
