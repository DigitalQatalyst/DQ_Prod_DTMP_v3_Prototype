const ENDORSEMENTS_KEY = "dtmp.knowledge.endorsements";

interface EndorsementRecord {
  itemId: string;
  userId: string;
  timestamp: string;
}

const loadEndorsements = (): EndorsementRecord[] => {
  const stored = localStorage.getItem(ENDORSEMENTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const saveEndorsements = (endorsements: EndorsementRecord[]) => {
  localStorage.setItem(ENDORSEMENTS_KEY, JSON.stringify(endorsements));
};

let endorsements: EndorsementRecord[] = loadEndorsements();

export function endorseKnowledgeItem(itemId: string, userId: string): boolean {
  if (hasUserEndorsed(itemId, userId)) {
    return false;
  }
  
  endorsements.push({
    itemId,
    userId,
    timestamp: new Date().toISOString(),
  });
  
  saveEndorsements(endorsements);
  return true;
}

export function unendorseKnowledgeItem(itemId: string, userId: string): boolean {
  const initialLength = endorsements.length;
  endorsements = endorsements.filter(
    (e) => !(e.itemId === itemId && e.userId === userId)
  );
  
  if (endorsements.length < initialLength) {
    saveEndorsements(endorsements);
    return true;
  }
  
  return false;
}

export function hasUserEndorsed(itemId: string, userId: string): boolean {
  return endorsements.some((e) => e.itemId === itemId && e.userId === userId);
}

export function getEndorsementCount(itemId: string): number {
  return endorsements.filter((e) => e.itemId === itemId).length;
}

export function getItemEndorsements(itemId: string): EndorsementRecord[] {
  return endorsements.filter((e) => e.itemId === itemId);
}
