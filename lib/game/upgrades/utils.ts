import { IPlayer } from '../types';

// Helper to access Player methods that might require casting if IPlayer is too restrictive
// or if we need to access private/internal methods (though ideally we shouldn't)
export const recalculatePlayerStats = (p: IPlayer) => {
    if (p.recalculateStats) p.recalculateStats();
};
