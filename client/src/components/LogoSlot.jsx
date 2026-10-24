// ============================================================================
//  LOGO SLOT - put the official Karunya logo here
//  1. Save the logo as:  client/public/karunya-logo.png
//  2. That's it - it shows up in the navbar and on the landing page.
//  Until the file exists, a plain bus icon is shown as a placeholder.
//  (We intentionally do NOT draw or invent a logo.)
// ============================================================================
import { useEffect, useState } from 'react';

const LOGO_SRC = '/karunya-logo.png';

const LogoSlot = ({ height = 36, light = false }) => {
  const [hasLogo, setHasLogo] = useState(false);

  // Try loading the file once; only swap the placeholder out if it really is an image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasLogo(img.naturalWidth > 0);
    img.onerror = () => setHasLogo(false);
    img.src = LOGO_SRC;
  }, []);

  if (hasLogo) {
    return (
      <span className="logo-slot">
        <img src={LOGO_SRC} alt="Karunya Institute of Technology and Sciences" height={height} />
      </span>
    );
  }

  return (
    <span
      className={`logo-slot rounded flex-shrink-0 ${light ? 'bg-white text-ku' : 'bg-ku text-white'}`}
      style={{ width: height, height }}
      title="Logo placeholder - add client/public/karunya-logo.png"
    >
      <i className="bi bi-bus-front-fill" style={{ fontSize: height * 0.55 }} />
    </span>
  );
};

export default LogoSlot;
