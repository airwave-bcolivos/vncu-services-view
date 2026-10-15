import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      
      {/* SECCIÓN HERO: Le agregamos min-h-[70vh] para que ocupe el 70% del alto de la pantalla, empujando lo demás hacia abajo */}
      <section className="flex flex-col items-center justify-center text-center px-6 min-h-[70vh] bg-white shadow-sm">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Bienvenido a <span className="text-blue-600">Vincu</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          La plataforma más rápida y segura para conectar con maestros expertos en gasfitería, electricidad, pintura y mucho más. Solucionamos tus problemas del hogar en un clic.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/register"
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors text-center"
          >
            Regístrate Gratis
          </Link>
          <Link 
            href="/login"
            className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 font-semibold rounded-lg shadow-sm transition-colors text-center"
          >
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* SECCIÓN INFORMATIVA: Le agregamos mt-12 (margen top) para separarlo aún más de la línea divisoria */}
      <section className="max-w-5xl mx-auto px-6 py-16 mt-12 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Quiénes somos?</h2>
            <p className="text-gray-600 leading-relaxed">
              Somos una iniciativa tecnológica nacida para formalizar y facilitar el contacto entre profesionales técnicos y familias que necesitan reparaciones urgentes. Validamos a nuestros especialistas para brindarte seguridad, calidad y confianza directamente en tu puerta.
            </p>
          </div>

          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Eres un Maestro Experto?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Únete a nuestra red de técnicos y haz crecer tus ingresos. En Vincu, tú decides qué trabajos aceptar según tu ubicación y disponibilidad.
            </p>
            <Link href="/register" className="text-blue-600 font-semibold hover:underline self-start">
              Crea tu perfil como técnico &rarr;
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}