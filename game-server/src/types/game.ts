// enemies, items, etc are all described entities
export interface DescribedEntity {
  id: string;
  name: string;
  description: string;
  // these three hidden fields are used to store lots more information about the entity, so that the LLM can "remember" the stats and statuses of the entity over a long period of time
  detailedStats: string;
  detailedStatuses: string;
  detailedAttributes: string;
  // this stores all updates to the item
  updatedInfo: string[];
}

export interface Player extends DescribedEntity {
  inventory: DescribedEntity[];
  currentRoomName: string;
  roomsVisitedHistory: string[]; // list of room name/descriptions visited
}

export interface GameState {
  player: Player;
  messageHistory: string[];
  sessionId: string;
  currentThemeDescription: string;
}
