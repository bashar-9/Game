
import math

def get_difficulty(t_seconds):
    # 0 - 5 mins: Linear 1.0 -> 6.0
linear = 1 + math.floor(t_seconds / 30) * 0.5

quadratic = 0
if t_seconds > 300:
    minutes_over = (t_seconds - 300) / 60
        # quadratic = Math.pow(minutesOver, 2) * 0.1; // OLD
        # quadratic = Math.pow(minutesOver, 2.1) * 1.2; // NEW (Intermediate)
        # quadratic = Math.pow(minutesOver, 2.2) * 1.5; // CURRENT
quadratic = math.pow(minutes_over, 2.2) * 1.5

return linear + quadratic

def get_enemy_hp(base_hp, diff_level, diff_mode = 'normal'):
    # diffScale = 1 + (diffLevel * 0.60); // OLD
    # diffScale = 1 + (diffLevel * 1.5); // NEW
diff_scale = 1 + (diff_level * 1.5)
    
    # settings.hpMult = 1.0 for normal
    settings_hp_mult = 1.0
    
    # levelMult = 1 + (playerLevel * 0.1)
    # We estimate player level roughly:
    # 0m: Lv1
    # 5m: Lv20 ?
    # 10m: Lv50 ?
    # 15m: Lv80 ?
    # 20m: Lv100 ?
    estimated_level = 1 + (diff_level * 1.5) # Rough guess
level_mult = 1 + (estimated_level * 0.1)

return int(base_hp * diff_scale * settings_hp_mult * level_mult)

print(f"{'Time':<10} | {'Diff':<10} | {'Basic HP':<10} | {'Mult':<10}")
print("-" * 50)

for m in range(0, 21):
    t = m * 60
d = get_difficulty(t)
hp = get_enemy_hp(30, d) # Base 30
mult = hp / 30
print(f"{m}m ({t}s) | {d:<10.2f} | {hp:<10} | {mult:<10.1f}x")
