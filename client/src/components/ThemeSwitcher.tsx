import { Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme, themeConfig, ThemeVariant } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
    const { theme, mode, setTheme, toggleMode } = useTheme();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label="Change theme"
                >
                    <Palette className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-64 p-3"
                align="end"
                side="top"
                sideOffset={8}
            >
                <div className="space-y-3">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">외관</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleMode}
                            className="h-8 gap-2"
                        >
                            {mode === "light" ? (
                                <>
                                    <Sun className="h-3.5 w-3.5" />
                                    <span className="text-xs">라이트</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="h-3.5 w-3.5" />
                                    <span className="text-xs">다크</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="border-t" />

                    {/* Theme Selection */}
                    <div className="space-y-2">
                        <span className="text-sm font-medium">테마</span>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(themeConfig) as ThemeVariant[]).map((themeKey) => {
                                const config = themeConfig[themeKey];
                                const isSelected = theme === themeKey;
                                const previewColor = mode === "light" ? config.lightPreview : config.darkPreview;

                                return (
                                    <button
                                        key={themeKey}
                                        onClick={() => setTheme(themeKey)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary/50",
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                : "border-border hover:bg-accent/50"
                                        )}
                                    >
                                        <div
                                            className="h-5 w-5 rounded-full shrink-0 ring-1 ring-black/10"
                                            style={{ backgroundColor: previewColor }}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {config.name}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {config.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
