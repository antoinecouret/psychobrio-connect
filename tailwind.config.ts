import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Theme colors
				'theme-0': 'hsl(var(--theme-color-0))',
				'theme-0-bg': 'hsl(var(--theme-color-0-bg))',
				'theme-1': 'hsl(var(--theme-color-1))',
				'theme-1-bg': 'hsl(var(--theme-color-1-bg))',
				'theme-2': 'hsl(var(--theme-color-2))',
				'theme-2-bg': 'hsl(var(--theme-color-2-bg))',
				'theme-3': 'hsl(var(--theme-color-3))',
				'theme-3-bg': 'hsl(var(--theme-color-3-bg))',
				'theme-4': 'hsl(var(--theme-color-4))',
				'theme-4-bg': 'hsl(var(--theme-color-4-bg))',
				'theme-5': 'hsl(var(--theme-color-5))',
				'theme-5-bg': 'hsl(var(--theme-color-5-bg))',
				'theme-6': 'hsl(var(--theme-color-6))',
				'theme-6-bg': 'hsl(var(--theme-color-6-bg))',
				'theme-7': 'hsl(var(--theme-color-7))',
				'theme-7-bg': 'hsl(var(--theme-color-7-bg))',
				'theme-8': 'hsl(var(--theme-color-8))',
				'theme-8-bg': 'hsl(var(--theme-color-8-bg))',
				'theme-9': 'hsl(var(--theme-color-9))',
				'theme-9-bg': 'hsl(var(--theme-color-9-bg))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
