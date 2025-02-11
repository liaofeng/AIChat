
import { cn } from "../lib/utils"
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "./ui/navigation-menu"

interface NavbarProps {
  isAdminMode: boolean;
  onModeChange: (isAdmin: boolean) => void;
}

export function Navbar({ isAdminMode, onModeChange }: NavbarProps) {
  return (
    <NavigationMenu className="w-full max-w-full justify-between">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              isAdminMode ? "text-muted-foreground" : "bg-primary text-primary-foreground"
            )}
            onClick={() => onModeChange(false)}
          >
            Search
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              isAdminMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
            onClick={() => onModeChange(true)}
          >
            Admin
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
