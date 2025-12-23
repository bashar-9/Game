import math
def get_difficulty(t):
    linear = 1 + math.floor(t / 30) * 0.5
    quadratic = 0
    if t > 300:
        minutes = (t - 300) / 60
        quadratic = math.pow(minutes, 2.2) * 1.5
    return linear + quadratic

def get_hp(base, diff):
    # New formula logic simulation
    diff_scale = 1 + (max(0, diff - 1) * 0.5)
    
    # Rough player level simulation
    est_lvl = 1 + (diff * 1.5)
    lvl_mult = 1 + (est_lvl * 0.1)
    
    return int(base * diff_scale * lvl_mult)

print(f"{'Min':<5} | {'Diff':<6} | {'HP':<6}")
for m in range(21):
    t = m * 60
    d = get_difficulty(t)
    hp = get_hp(30, d)
    print(f"{m:<5} | {d:<6.2f} | {hp:<6}")
