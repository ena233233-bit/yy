纸张好感 = 0
金币 = 20


def 显示状态():
    print("\n===== 当前状态 =====")
    print(f"❤️ 纸张好感：{纸张好感}")
    print(f"💰 金币：{金币}")


def 送奶茶():
    global 纸张好感, 金币

    if 金币 < 10:
        print("\n😓 金币不够，先去打工吧！")
        return

    金币 -= 10
    纸张好感 += 10
    print("\n🥤 你送了纸张一杯奶茶！")
    print("❤️ 好感 +10，💰 金币 -10")


def 打工():
    global 金币
    金币 += 20
    print("\n💼 你认真打工了一会儿。")
    print("💰 金币 +20")


print("欢迎来到奶茶好感小游戏 😈")

while True:
    显示状态()

    print("\n今天要做什么？")
    print("1. 送奶茶")
    print("2. 打工")
    print("3. 退出游戏")

    选择 = input("请输入 1 / 2 / 3：")

    if 选择 == "1":
        送奶茶()
    elif 选择 == "2":
        打工()
    elif 选择 == "3":
        print("\n游戏结束！")
        print(f"最终纸张好感：{纸张好感}")
        print(f"最终金币：{金币}")
        break
    else:
        print("\n😡 没有这个选项，请输入 1、2 或 3。")
