import { cn } from 'src/utils/cn';

// PulseLoader Component
export const PulseLoader = ({ color = '#4285f4', size = 10, ...props }) => (
  <div className="inline-flex gap-1 items-center" {...props}>
    {[0, 0.2, 0.4].map((delay, i) => (
      <span
        key={i}
        className="inline-block rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          animation: `pulse 1.5s ease-in-out ${delay}s infinite`
        }}
      />
    ))}
    <style jsx>{`
      @keyframes pulse {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `}</style>
  </div>
);

// PuffLoader Component
export const PuffLoader = ({ color = '#4285f4', size = 60, ...props }) => (
  <div
    className="relative"
    style={{ width: size, height: size }}
    {...props}
  >
    <div
      className="absolute top-0 left-0 w-full h-full rounded-full border-[3px]"
      style={{
        borderColor: color,
        animation: 'puff 2s ease-out infinite'
      }}
    />
    <div
      className="absolute top-0 left-0 w-full h-full rounded-full border-[3px]"
      style={{
        borderColor: color,
        animation: 'puff 2s ease-out 1s infinite'
      }}
    />
    <style jsx>{`
      @keyframes puff {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `}</style>
  </div>
);

// ClipLoader Component
export const ClipLoader = ({ color = '#4285f4', size = 35, ...props }) => (
  <>
    <div
      className="rounded-full border-[3px]"
      style={{
        width: size,
        height: size,
        borderColor: `${color}33`,
        borderTopColor: color,
        animation: 'spin 1s linear infinite'
      }}
      {...props}
    />
    <style jsx>{`
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </>
);

// FadeLoader Component
export const FadeLoader = ({ color = '#4285f4', ...props }) => (
  <div className="inline-flex gap-0.5 items-center" {...props}>
    {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
      <span
        key={i}
        className="inline-block w-1 h-9 rounded"
        style={{
          backgroundColor: color,
          animation: `fade 1.2s ease-in-out ${delay}s infinite`
        }}
      />
    ))}
    <style jsx>{`
      @keyframes fade {
        0%, 100% {
          opacity: 0.25;
        }
        50% {
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

// BarLoader Component
export const BarLoader = ({ color = '#4285f4', ...props }) => (
  <div className="inline-flex gap-[3px] items-center" {...props}>
    {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
      <span
        key={i}
        className="inline-block w-1 h-[18px] rounded"
        style={{
          backgroundColor: color,
          animation: `barStretch 1.2s ease-in-out ${delay}s infinite`
        }}
      />
    ))}
    <style jsx>{`
      @keyframes barStretch {
        0%, 40%, 100% {
          transform: scaleY(0.4);
        }
        20% {
          transform: scaleY(1);
        }
      }
    `}</style>
  </div>
);

// Default export for backward compatibility
const Spinners = {
  PulseLoader,
  PuffLoader,
  ClipLoader,
  FadeLoader,
  BarLoader
};

export default Spinners;
