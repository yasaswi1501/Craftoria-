import { useState, useEffect } from 'react';

// Renders a user's profile picture, falling back to their initial (or a
// generic icon) if the URL is missing or fails to load -- e.g. a Google
// avatar URL that's since expired or been blocked by the browser.
const Avatar = ({ src, name, className = '', fallbackClassName = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={fallbackClassName}>
      {name ? name[0].toUpperCase() : '👤'}
    </span>
  );
};

export default Avatar;
