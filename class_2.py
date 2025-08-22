#用python创建一个人的类,基本信息,构造方法
class Person(object):
    class_name = "人类" 
    
    def __init__(self, name, birth):
        self.name = name
        self.birth = birth
        self.height = 180
        self.legs = 2
    
    def say(self):
        print("我是%s,我今年%d岁了" % (self.name, 2025-self.birth))
    
    def jiafa(self, a, b):
        return a + b
    
    def sit(self):
        print("%s正在坐着" % (self.name))
        
    def rolling(self):
        print("%s正在地上打滚^_^" % (self.name))
# print(Person.class_name)
# p1 = Person("小明", 1990)
# p1.say()
# p1.sit()
# p1.rolling()
# 
p2 = Person("张三", 2004)
print(p2.name)
print(p2.height)
print(p2.legs)

p2.rolling()
p2.sit()
p2.say()