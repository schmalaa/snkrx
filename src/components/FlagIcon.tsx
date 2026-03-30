export const FlagIcon = ({ code, size = 24 }: { code: string, size?: number }) => {
  if (!code || code.length !== 2) return null;
  return (
    <img 
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`} 
      width={size}
      alt={code}
      style={{ display: 'inline-block', borderRadius: '4px', objectFit: 'cover', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}
    />
  );
};
