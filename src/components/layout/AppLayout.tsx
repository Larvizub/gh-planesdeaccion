import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  LayoutDashboard, 
  Settings, 
  FileText, 
  ClipboardList,
  Users, 
  ShieldCheck,
  Building2, 
  UserCircle, 
  Clock, 
  LogOut,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppContext } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ref, onValue, update } from 'firebase/database';
import { Label } from '@/components/ui/label';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  isSubItem?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, href, isActive, isSubItem, children, onClick }: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <div className={cn(
          "mt-1 ml-4 flex flex-col gap-1 border-l pl-3 transition-all duration-200 ease-in-out overflow-hidden",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        isSubItem && "py-1.5"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, userData, permissions, recinto, db } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [depts, setDepts] = useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    if (userData && !userData.departmentId) {
      const deptRef = ref(db, `config/${recinto}/departamentos`);
      onValue(deptRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, val]) => ({ id, name: (val as { name: string }).name }));
          setDepts(list);
          setShowDeptModal(true);
        }
      });
    }
  }, [userData, db, recinto]);

  const handleSaveDept = async () => {
    if (!selectedDept || !user) return;
    const dept = depts.find(d => d.id === selectedDept);
    await update(ref(db, `users/${recinto}/${user.uid}`), {
      departmentId: selectedDept,
      departmentName: dept?.name
    });
    setShowDeptModal(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { id: 'eventos', label: 'Eventos', href: '/eventos', icon: Calendar },
    { id: 'planes', label: 'Planes de Acción', href: '/planes-accion', icon: FileText },
    { id: 'aprobaciones', label: 'Aprobaciones', href: '/aprobaciones', icon: CheckCircle2 },
    { id: 'reportes', label: 'Reportes', href: '/reportes', icon: ClipboardList },
    { id: 'resultados', label: 'Resultados', href: '/resultados', icon: BarChart3 },
    { 
      id: 'configuracion',
      label: 'Configuración', 
      href: '/configuracion', 
      icon: Settings,
      subItems: [
        { id: 'usuarios', label: 'Usuarios', href: '/configuracion/usuarios', icon: Users },
        { id: 'departamentos', label: 'Departamentos', href: '/configuracion/departamentos', icon: Building2 },
        { id: 'roles', label: 'Roles', href: '/configuracion/roles', icon: ShieldCheck },
        { id: 'tiempos', label: 'Tiempos Límites', href: '/configuracion/tiempos', icon: Clock },
      ]
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'configuracion') {
      const hasSubItems = item.subItems?.some(sub => permissions?.[sub.id]);
      return hasSubItems;
    }
    return permissions?.[item.id];
  }).map(item => {
    if (item.subItems) {
      return {
        ...item,
        subItems: item.subItems.filter(sub => permissions?.[sub.id])
      };
    }
    return item;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r bg-card md:flex flex-col shrink-0 overflow-hidden">
        <div className="p-6 flex items-center justify-center border-b shrink-0">
          <img 
            src="https://costaricacc.com/cccr/Logoheroica.png" 
            alt="Logo Heroica" 
            className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
          />
        </div>
        
        <div className="px-4 py-2">
          <div className="rounded-md bg-muted p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recinto: {recinto || 'No seleccionado'}
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={location.pathname === item.href || (item.subItems && location.pathname.startsWith(item.href))}
            >
              {item.subItems?.map((sub) => (
                <SidebarItem
                  key={sub.href}
                  icon={sub.icon}
                  label={sub.label}
                  href={sub.href}
                  isActive={location.pathname === sub.href}
                  isSubItem
                />
              ))}
            </SidebarItem>
          ))}
        </nav>

        <Separator />
        
        <div className="p-4 space-y-2">
          <Button asChild variant="ghost" size="sm" className={cn("w-full justify-start gap-3", location.pathname === '/configuracion/perfil' && "bg-accent text-accent-foreground")}>
            <Link to="/configuracion/perfil" className="flex items-center gap-3">
              <UserCircle className="h-4 w-4" />
              <span>Mi Perfil</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
            <h1 className="font-semibold text-lg truncate capitalize">
              {menuItems.find(item => location.pathname.startsWith(item.href))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/configuracion/perfil" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{userData?.displayName || user?.email}</p>
                <p className="text-xs text-muted-foreground">{userData?.role} - {userData?.departmentName || 'Sin depto'}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <div 
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-full max-w-[280px] bg-card md:hidden transition-transform duration-300 ease-in-out border-r shadow-xl",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
           <div className="flex flex-col h-full">
              <div className="p-4 flex items-center justify-between border-b">
                <img 
                  src="https://costaricacc.com/cccr/Logoheroica.png" 
                  alt="Logo" 
                  className="h-10 w-auto object-contain dark:brightness-0 dark:invert" 
                />
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><X /></Button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredMenuItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={location.pathname === item.href || (item.subItems && location.pathname.startsWith(item.href))}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.subItems?.map((sub) => (
                      <SidebarItem
                        key={sub.href}
                        icon={sub.icon}
                        label={sub.label}
                        href={sub.href}
                        isActive={location.pathname === sub.href}
                        isSubItem
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                  </SidebarItem>
                ))}
                <Separator className="my-2" />
                <SidebarItem
                  icon={UserCircle}
                  label="Mi Perfil"
                  href="/configuracion/perfil"
                  isActive={location.pathname === '/configuracion/perfil'}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </nav>
              <div className="p-4 border-t space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </Button>
                <Button variant="outline" size="sm" className="w-full text-destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
           </div>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Bienvenido a la plataforma</DialogTitle>
            <DialogDescription>
              Para continuar, por favor selecciona el departamento al que perteneces.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept">Departamento</Label>
              <Select onValueChange={setSelectedDept} value={selectedDept}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {depts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!selectedDept} onClick={handleSaveDept} className="w-full">
              Confirmar Departamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
