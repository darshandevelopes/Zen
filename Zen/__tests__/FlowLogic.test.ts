import {describe, it, expect} from '@jest/globals';

describe('Zen Core Business Logic', () => {
  describe('SAD Coin Calculations', () => {
    const calculateCoins = (anxietyLevel: number, idealLevel: number) => {
      return Math.max(0, anxietyLevel - idealLevel);
    };

    it('calculates SAD coins correctly when anxiety is greater than ideal', () => {
      expect(calculateCoins(8, 3)).toBe(5);
      expect(calculateCoins(5, 1)).toBe(4);
    });

    it('returns zero coins when anxiety equals ideal level', () => {
      expect(calculateCoins(5, 5)).toBe(0);
    });

    it('clamps coins to 0 when anxiety level is lower than ideal level (never negative)', () => {
      expect(calculateCoins(2, 6)).toBe(0);
      expect(calculateCoins(1, 10)).toBe(0);
    });

    it('safely handles missing or undefined coin params', () => {
      const getInitialCoins = (paramCoins?: number) => {
        return typeof paramCoins === 'number' ? paramCoins : 0;
      };
      expect(getInitialCoins(undefined)).toBe(0);
      expect(getInitialCoins(4)).toBe(4);
    });
  });

  describe('Activity Selection and Coin Tracking', () => {
    it('deducts credit when an activity is selected and restores credit when toggled off', () => {
      let coins = 10;
      let selected: string[] = [];

      const toggleActivity = (id: string, credit: number) => {
        if (selected.includes(id)) {
          selected = selected.filter(item => item !== id);
          coins += credit;
        } else {
          selected = [...selected, id];
          coins -= credit;
        }
      };

      // Select activity 1 (cost 2)
      toggleActivity('1', 2);
      expect(selected).toEqual(['1']);
      expect(coins).toBe(8);

      // Select activity 2 (cost 3)
      toggleActivity('2', 3);
      expect(selected).toEqual(['1', '2']);
      expect(coins).toBe(5);

      // Deselect activity 1 (cost 2 restored)
      toggleActivity('1', 2);
      expect(selected).toEqual(['2']);
      expect(coins).toBe(7);
    });
  });

  describe('Progress Tracker Completion Logic', () => {
    const isCompleted = (selectedIds: string[], targetList: {id: string}[]) => {
      return targetList.length > 0 && selectedIds.length >= targetList.length;
    };

    it('passes completion when all selected user activities are checked off', () => {
      const userChallenges = [
        {id: '1', name: 'Walk outside', credit: 2},
        {id: '2', name: 'Deep breath', credit: 1},
      ];
      const selected = ['1', '2'];

      expect(isCompleted(selected, userChallenges)).toBe(true);
    });

    it('blocks completion when user has remaining unchecked activities', () => {
      const userChallenges = [
        {id: '1', name: 'Walk outside', credit: 2},
        {id: '2', name: 'Deep breath', credit: 1},
        {id: '3', name: 'Listen to music', credit: 2},
      ];
      const selected = ['1'];

      expect(isCompleted(selected, userChallenges)).toBe(false);
    });
  });

  describe('Reward Formatting and Fallbacks', () => {
    it('uses the selected reward name or falls back to Reward', () => {
      const formatRewardTitle = (rewards?: {name: string}[]) => {
        return rewards?.[0]?.name || 'Reward';
      };

      expect(formatRewardTitle([{name: 'Go eat Icecream'}])).toBe(
        'Go eat Icecream',
      );
      expect(formatRewardTitle([{name: 'Nap'}])).toBe('Nap');
      expect(formatRewardTitle(undefined)).toBe('Reward');
      expect(formatRewardTitle([])).toBe('Reward');
    });
  });
});
