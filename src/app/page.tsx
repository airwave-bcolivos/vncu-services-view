
import Link from "next/link";
import Header from "@/components/header/header";

export default function Home() {
  return (
      <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <Header />

        {/* SECCIÓN HERO */}
        <section className="flex min-h-[70vh] flex-col items-center justify-center bg-white px-6 text-center shadow-sm transition-colors duration-300 dark:bg-gray-900">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-5xl">
            Bienvenido a <span className="text-blue-600">Vincu</span>
          </h1>

          <p className="mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            La plataforma más rápida y segura para conectar con maestros expertos en gasfitería, electricidad, pintura y mucho más. Solucionamos tus problemas del hogar en un clic.
          </p>

          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
                href="/register"
                className="w-full rounded-lg bg-blue-600 px-8 py-3 text-center font-semibold text-white shadow-md transition-colors hover:bg-blue-700 sm:w-auto"
            >
              Regístrate Gratis
            </Link>

            <Link
                href="/login"
                className="w-full rounded-lg border border-blue-600 bg-white px-8 py-3 text-center font-semibold text-blue-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 sm:w-auto"
            >
              Iniciar Sesión
            </Link>
          </div>
        </section>

        {/* SECCIÓN INFORMATIVA */}
        <section className="mx-auto mt-12 mb-20 max-w-5xl px-6 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">

            {/* QUIÉNES SOMOS */}
            <div className="flex flex-col">
              <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
                ¿Quiénes somos?
              </h2>

              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                Somos una iniciativa tecnológica nacida para formalizar y facilitar el contacto entre profesionales técnicos y familias que necesitan reparaciones urgentes. Validamos a nuestros especialistas para brindarte seguridad, calidad y confianza directamente en tu puerta.
              </p>
            </div>

            {/* TÉCNICOS */}
            <div className="flex flex-col">
              <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
                ¿Eres un Maestro Experto?
              </h2>

              <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">
                Únete a nuestra red de técnicos y haz crecer tus ingresos. En Vincu, tú decides qué trabajos aceptar según tu ubicación y disponibilidad.
              </p>

              <Link
                  href="/register"
                  className="self-start font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                Crea tu perfil como técnico &rarr;
              </Link>
            </div>

          </div>
        </section>
      </main>
  );
}
