import { SpineProvider } from './components/SpineContext'
import ScrollProgressBar from './components/ScrollProgressBar'
import SignalRail from './components/SignalRail'
import Nav from './components/Nav'
import Hero from './components/Hero'
import TrustMarquee from './components/TrustMarquee'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Stats from './components/Stats'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

function App() {
  return (
    <SpineProvider>
      <ScrollProgressBar />
      <SignalRail />
      <Nav />
      <main>
        <Hero />
        <TrustMarquee />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </SpineProvider>
  )
}

export default App
