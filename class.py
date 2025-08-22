class Dog:
    #构造一个小狗的函数
    def __init__(self,name,breed,age):
        self.name = name #属性:名称
        self.breed = breed #属性:品种
        self.age = age #属性:年龄
        print("小狗 %s 创建成功!" % self.name)
    #方法行为
    def sit(self):
        print("%s 现在正在蹲下" % self.name)
    def roll_over(self):
        print("%s 现在正在打滚" % self.name)
    def bark(self):
        print("%s 现在正在汪汪叫" % self.name)
    def eat(self,food):
        print("%s 现在正在吃 %s" % (self.name,food))
        # print("%s 现在正在吃东西" % self.name)
    def sleep(self):
        print("%s 现在正在睡觉" % self.name)
    def play(self):
        print("%s 现在正在玩" % self.name)
    def __str__(self): #描述对象的信息
        return "小狗的名称是 %s,品种是 %s,年龄是 %s" % (self.name,self.breed,self.age)
    
dog1 = Dog("丧彪","秋田犬",2)
dog2 = Dog("黑虎","黑背",1.5)

# print(dog1)
# # print(dog2)
# dog1.sit()
# dog1.roll_over()
# dog1.bark()
# dog1.eat("骨头")
# dog1.sleep()
# dog1.play()

print(dog2)
dog2.sit()
dog2.roll_over()
dog2.bark()
