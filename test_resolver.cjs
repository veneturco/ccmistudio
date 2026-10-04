const mockDict = {
  clinical: {
    cb: { hematologia_completa: true },
    checkbox: { radiologia: true }
  }
};

const resolve = (dataDictionary, dataKey) => {
  if (!dataDictionary || !dataKey) return undefined;
  if (dataKey in dataDictionary) return dataDictionary[dataKey];
  const parts = dataKey.split('.');
  let current = dataDictionary;
  for (const part of parts) {
    if (current === undefined || current === null) break;
    if (current[part] !== undefined) {
      current = current[part];
    } else {
      const foundKey = Object.keys(current).find(
        (k) => k.toLowerCase() === part.toLowerCase() ||
               k.toLowerCase().replace(/[^a-z0-9]/g, '_') === part.toLowerCase().replace(/[^a-z0-9]/g, '_')
      );
      if (foundKey) {
        current = current[foundKey];
      } else {
        current = undefined;
        break;
      }
    }
  }
  return current;
};

console.log('hema:', resolve(mockDict, 'clinical.cb.hematologia_completa'));
console.log('radio:', resolve(mockDict, 'clinical.checkbox.radiologia'));