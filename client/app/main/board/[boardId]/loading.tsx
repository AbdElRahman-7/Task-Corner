export default function Loading() {
  return (
    <div className="boardPage">
      <div className="boardHeader">
        <div 
          style={{ width: 'clamp(110px, 35vw, 160px)', height: '36px', borderRadius: '40px', marginBottom: '1rem' }} 
          className="skeleton-shimmer"
        />
        <div 
          style={{ width: 'clamp(180px, 60vw, 320px)', height: 'clamp(38px, 7vw, 54px)' }} 
          className="skeleton-shimmer"
        />
      </div>

      <div className="boardContent">
        {[1, 2, 3].map((i) => (
          <div key={i} className="listCard skeleton-shimmer" style={{ minHeight: 'min(500px, 70vh)', opacity: 0.4 }}>
            <div className="listCard__header" style={{ height: '64px' }} />
            <div className="listCard__tasks" style={{ gap: 'clamp(0.7rem, 2vw, 1.25rem)', padding: '0.9rem' }}>
              {[1, 2, 3].map((j) => (
                <div 
                  key={j} 
                  style={{ height: 'clamp(85px, 18vw, 110px)', borderRadius: '12px', background: 'rgba(255,255,255,1)', opacity: 0.1 }} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
