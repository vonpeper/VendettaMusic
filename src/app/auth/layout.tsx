import { Music } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57922c3b1?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      
      <div className="container relative z-10 mx-auto px-4 py-8 flex flex-col items-center">
        <div className="mb-12">
          <img 
            src="/images/logo-vendetta-horizontal.png" 
            alt="Vendetta Music" 
            className="h-32 w-auto object-contain"
          />
        </div>
        
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
