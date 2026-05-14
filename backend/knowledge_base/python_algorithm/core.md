# Python算法工程师面试知识库

## Python 语言特性

GIL（全局解释器锁）：CPython中每个线程执行前需获取GIL，导致多线程无法真正并行执行CPU密集型任务。解决方案：多进程（multiprocessing）绕过GIL、C扩展（NumPy底层释放GIL）、PyPy/Jython。IO密集型任务多线程有效（IO时会释放GIL）。

装饰器：函数是一等公民，装饰器是接受函数返回函数的高阶函数，@语法糖，functools.wraps保留原函数元信息。应用场景：日志、权限校验、缓存（functools.lru_cache）、性能计时。

生成器与迭代器：实现__iter__和__next__的对象是迭代器，yield语句创建生成器，惰性求值节省内存，适合大数据处理。yield from委托子生成器。

上下文管理器：__enter__/__exit__协议，with语句，contextlib.contextmanager装饰器简化实现，应用：资源管理（文件/数据库连接）、计时器、异常处理。

元类（metaclass）：类的类，type是所有类的默认元类，__new__创建类，__init__初始化类，应用：ORM框架（Django Model）、单例模式、接口强制检查。

Python内存管理：引用计数（主要）+ 标记清除（解决循环引用）+ 分代回收。小整数（-5~256）和常用字符串被驻留（interning）复用。

## 数据结构

数组与链表：数组O(1)随机访问，O(n)插入删除；链表O(n)访问，O(1)头部插入删除。Python list是动态数组，deque是双向链表。

栈与队列：栈LIFO（函数调用、括号匹配、单调栈），队列FIFO（BFS、任务调度），collections.deque实现两种结构均为O(1)。

哈希表：Python dict底层，O(1)平均查找插入删除，哈希冲突用开放寻址法（Python3.6+紧凑布局），负载因子>2/3时扩容。

二叉树：前序/中序/后序遍历（递归/迭代），层序遍历（BFS+deque），BST（左<根<右），AVL树（平衡因子≤1），红黑树（近似平衡，Java TreeMap/TreeSet底层）。

堆（优先队列）：完全二叉树，最大堆/最小堆，Python heapq模块（最小堆），O(log n)插入删除，O(1)查找最值，应用：TopK问题、Dijkstra算法、任务调度。

图：邻接矩阵（稠密图，O(V²)空间）vs邻接表（稀疏图，O(V+E)空间），DFS/BFS遍历，拓扑排序（Kahn算法/DFS），最短路径（Dijkstra/Bellman-Ford/SPFA）。

## 经典算法

排序算法：快速排序（平均O(nlogn)，分治，pivot选择影响性能），归并排序（稳定，O(nlogn)，适合链表和外排），堆排序（O(nlogn)，原地，不稳定），Python sorted()基于TimSort（归并+插入排序混合，稳定）。

二分查找：O(log n)，适用于有序数组，left+right//2防溢出，边界条件（left<right vs left<=right），bisect模块。

动态规划：最优子结构+重叠子问题，自顶向下（记忆化递归）or自底向上（填表），状态定义+转移方程+边界，经典题型：背包（0-1/完全/多重）、最长公共子序列LCS、最长递增子序列LIS、编辑距离。

贪心算法：局部最优推导全局最优，无后效性，需证明贪心选择性质，常见：区间调度、霍夫曼编码、Prim/Kruskal最小生成树。

回溯法：DFS+剪枝，解空间树，经典题型：全排列、组合、子集、N皇后、数独、单词搜索。

双指针/滑动窗口：同向双指针（滑动窗口，最长子串/子数组）、相向双指针（两数之和、接雨水）、快慢指针（链表环检测）。

## 机器学习基础

监督学习：分类（逻辑回归、SVM、决策树、随机森林、GBDT、XGBoost）、回归（线性回归、Ridge/Lasso、SVR）。

无监督学习：聚类（K-Means、DBSCAN、层次聚类）、降维（PCA主成分分析、t-SNE可视化）。

模型评估：分类指标（Accuracy、Precision、Recall、F1-score、AUC-ROC），回归指标（MAE、MSE、RMSE、R²），交叉验证（k-fold），过拟合（正则化L1/L2、Dropout、数据增强、早停）。

特征工程：缺失值处理（均值/中位数/插值/模型填充）、类别编码（One-Hot/Label/Target Encoding）、数值特征（归一化MinMaxScaler/标准化StandardScaler）、特征选择（Filter/Wrapper/Embedded方法）。

集成学习：Bagging（并行，随机森林，降低方差）、Boosting（串行，AdaBoost/GBDT/XGBoost，降低偏差）、Stacking（模型融合）。XGBoost优化：二阶泰勒展开、正则化、列采样、近似分位数、缺失值处理。

## 深度学习

神经网络基础：前向传播、反向传播（链式法则）、梯度下降（SGD/Adam/RMSProp）、激活函数（ReLU解决梯度消失、Sigmoid/Tanh、GELU用于Transformer）、批归一化（BN）、Dropout。

CNN（卷积神经网络）：卷积层（特征提取，权重共享）、池化层（下采样）、全连接层，经典架构（LeNet/AlexNet/VGG/ResNet残差连接/EfficientNet）。

RNN/LSTM/GRU：序列建模，LSTM通过门控机制（输入门/遗忘门/输出门）解决梯度消失，双向LSTM，应用NLP序列任务。

Transformer：自注意力机制（Q/K/V，Multi-Head Attention），位置编码，Encoder-Decoder架构，Pre-norm/Post-norm，BERT（双向，MLM预训练）/GPT（单向，自回归生成），应用：NLP、CV（ViT）、多模态。

## PyTorch 实践

Tensor操作：创建（torch.tensor/zeros/ones/rand/randn），数据类型，设备（CPU/GPU），自动微分（requires_grad=True，backward()，.grad，no_grad上下文）。

自定义Dataset：继承torch.utils.data.Dataset，实现__len__和__getitem__，DataLoader（batch_size/shuffle/num_workers/pin_memory）。

模型定义：nn.Module，__init__定义层，forward定义前向，常用层（nn.Linear/Conv2d/BatchNorm2d/Dropout/Embedding/MultiheadAttention）。

训练循环：optimizer.zero_grad() → outputs = model(inputs) → loss = criterion(outputs, labels) → loss.backward() → optimizer.step()，学习率调度（StepLR/CosineAnnealingLR/ReduceLROnPlateau）。

模型保存与加载：torch.save(model.state_dict())，model.load_state_dict(torch.load())，torchscript/onnx导出推理。

混合精度训练：torch.cuda.amp.autocast + GradScaler，减少显存占用，加速训练。

## 常见面试题及答案要点

Q: 解释梯度消失和梯度爆炸，如何解决？
A: 梯度消失：深层网络反向传播时梯度趋近于0，网络无法更新参数。解决：ReLU激活函数、残差连接（ResNet）、BN、LSTM门控、梯度裁剪。梯度爆炸：梯度过大导致参数更新失控，解决：梯度裁剪（clip_grad_norm_）、权重初始化（Xavier/He）、BN。

Q: 过拟合的表现及解决方案？
A: 训练集准确率高但验证集/测试集低。解决：增加数据（数据增强）、正则化（L1稀疏化参数/L2权重衰减）、Dropout（随机丢弃神经元）、早停（Early Stopping监控验证集loss）、减小模型复杂度、集成学习。

Q: Attention机制的作用是什么？
A: 解决序列建模中长程依赖问题，为每个位置计算与所有位置的相关性权重（通过Q·K/√d_k的softmax），加权求和V得到上下文感知的表示。自注意力复杂度O(n²)，线性注意力变体降低复杂度。

Q: 如何处理类别不平衡问题？
A: 重采样（过采样少数类SMOTE/欠采样多数类）、类别权重（class_weight参数）、代价敏感学习（Focal Loss：α平衡因子+γ聚焦困难样本）、阈值调整（根据业务需求调整分类阈值）、评估指标换用F1/AUC而非Accuracy。

Q: 如何设计一个推荐系统？
A: 召回层（协同过滤CF/向量召回ANN/规则召回）→排序层（LR/GBDT+人工特征 或 DNN端到端学习 或 Wide&Deep/DeepFM/DIN注意力机制）→重排层（多样性/去重/业务规则）→在线服务（特征实时拼接/模型serving/A-B实验）。
