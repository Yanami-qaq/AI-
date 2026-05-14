# Java后端开发工程师面试知识库

## JVM 核心

JVM内存模型分为：堆（Heap）、方法区（Method Area/MetaSpace）、虚拟机栈（VM Stack）、本地方法栈、程序计数器。其中堆是垃圾回收的主要区域，分为新生代（Eden + S0 + S1）和老年代。

垃圾回收算法：标记-清除（产生碎片）、标记-整理（适合老年代）、复制算法（适合新生代）、分代收集。

常见GC收集器：Serial、ParNew、CMS（并发标记清除，低停顿但有碎片）、G1（分区收集，可预测停顿时间，JDK9默认）、ZGC（超低停顿，JDK15正式）。

类加载机制：加载→验证→准备→解析→初始化，双亲委派模型（Bootstrap→Extension→Application），防止类重复加载和核心类被篡改。

JVM调优常用参数：-Xms（初始堆大小）、-Xmx（最大堆大小）、-XX:NewRatio（新老代比例）、-XX:+UseG1GC（启用G1）、-XX:+HeapDumpOnOutOfMemoryError（OOM时dump）。

## Java 并发

synchronized 关键字：对象锁/类锁，偏向锁→轻量级锁→重量级锁的升级过程，不可中断。

ReentrantLock：可中断、可设置公平锁、支持多个条件变量（Condition），tryLock()非阻塞获取锁。

volatile：保证可见性和有序性（防止指令重排序），不保证原子性。底层通过内存屏障实现。

ThreadLocal：每个线程持有独立副本，避免共享，需注意内存泄漏（WeakReference key，调用remove()清理）。

线程池 ThreadPoolExecutor 核心参数：corePoolSize、maximumPoolSize、keepAliveTime、workQueue（ArrayBlockingQueue/LinkedBlockingQueue/SynchronousQueue）、RejectedExecutionHandler（AbortPolicy/CallerRunsPolicy/DiscardPolicy/DiscardOldestPolicy）。

Callable与Future、CompletableFuture异步编程，CountDownLatch、CyclicBarrier、Semaphore的用途区别。

happens-before原则：程序顺序规则、监视器锁规则、volatile变量规则、线程启动规则、线程终止规则。

## Spring Boot / Spring Framework

IoC（控制反转）：将对象创建和依赖关系交由容器管理，通过@Autowired/@Resource注入，底层是BeanFactory/ApplicationContext。

AOP（面向切面编程）：通过动态代理（JDK动态代理/CGLIB）实现横切关注点，核心概念：切面（Aspect）、切点（Pointcut）、通知（Advice：@Before/@After/@Around/@AfterReturning/@AfterThrowing）。

Spring Bean的作用域：singleton（默认）、prototype、request、session、application。

Spring Boot自动配置原理：@SpringBootApplication = @Configuration + @ComponentScan + @EnableAutoConfiguration。通过spring.factories（SPI机制）加载AutoConfiguration类，条件注解@ConditionalOnClass/@ConditionalOnMissingBean控制是否生效。

Spring事务：@Transactional，传播行为（REQUIRED/REQUIRES_NEW/NESTED），隔离级别（READ_UNCOMMITTED/READ_COMMITTED/REPEATABLE_READ/SERIALIZABLE），事务失效场景（方法非public、同类内调用、异常被捕获、异常类型不匹配）。

Spring MVC请求处理流程：DispatcherServlet → HandlerMapping → HandlerAdapter → Handler → ViewResolver。

## MySQL 数据库

索引原理：B+树（叶节点存数据/行指针，非叶节点只存索引），聚簇索引（主键索引，叶节点存完整行数据），非聚簇索引（叶节点存主键值，需回表查询）。

索引优化：最左前缀原则（联合索引使用），覆盖索引（查询列全在索引中，避免回表），索引下推（ICP，在索引层过滤条件），EXPLAIN分析执行计划（type: ALL/index/range/ref/eq_ref/const）。

索引失效场景：对索引列使用函数/运算、LIKE前缀通配符（%xxx）、类型隐式转换、OR条件（部分情况）、NOT IN/!=。

事务隔离级别与问题：读未提交（脏读）、读提交（不可重复读，Oracle/SQL Server默认）、可重复读（幻读，MySQL InnoDB默认，MVCC解决不可重复读）、串行化。InnoDB通过MVCC（多版本并发控制）和间隙锁解决幻读。

MVCC机制：每行数据有trx_id（事务ID）和roll_pointer（指向undo log），Read View决定哪些版本可见。

锁类型：共享锁（S）、排他锁（X）、意向锁（IS/IX）、间隙锁（Gap Lock）、临键锁（Next-Key Lock = 行锁+间隙锁）。

慢查询优化步骤：开启慢查询日志→EXPLAIN分析→针对性加索引→避免索引失效→必要时分表分库。

## Redis 缓存

数据结构：String（SDS，计数器/缓存）、List（双向链表/压缩列表，消息队列）、Hash（哈希表，对象存储）、Set（哈希表/整数集合，去重/交并差）、ZSet（跳表+哈希表，排行榜）。

持久化：RDB（定时快照，体积小，恢复快，可能丢数据）、AOF（追加命令日志，fsync策略，数据更安全，文件大）、混合持久化（RDB+AOF，Redis4.0+推荐）。

缓存常见问题：
- 缓存穿透：大量请求不存在的key直接打到数据库。解决：布隆过滤器/缓存空值。
- 缓存击穿：热点key过期瞬间大量并发打到数据库。解决：互斥锁/永不过期。
- 缓存雪崩：大量key同时过期或Redis宕机。解决：过期时间加随机值/多级缓存/集群。

分布式锁：SET key value NX PX timeout 实现，用UUID作value保证只有持有者可删除，Redisson框架实现看门狗续期。

Redis集群：主从复制（读写分离）、哨兵模式（自动故障转移）、Cluster模式（分片，16384个hash slot）。

## 分布式系统

CAP理论：一致性（C）、可用性（A）、分区容错性（P），三者不可兼得，P无法避免，所以在CP和AP之间选择。

服务注册与发现：Nacos（CP/AP可切换，配置中心+服务发现）、Eureka（AP，自我保护机制）、Consul（CP）。

负载均衡：客户端负载（Ribbon/SpringCloud LoadBalancer，轮询/随机/权重/最少连接）、服务端负载（Nginx，upstream配置）。

服务熔断与降级：Hystrix（线程隔离/信号量隔离，熔断器状态：CLOSED/OPEN/HALF-OPEN）、Sentinel（基于滑动窗口，规则配置中心）。

分布式事务：2PC（两阶段提交，同步阻塞）、TCC（Try-Confirm-Cancel，补偿型）、Saga（长事务，本地事务链）、消息最终一致性（可靠消息服务）、Seata框架（支持AT/TCC/Saga模式）。

消息队列：RabbitMQ（AMQP协议，Exchange类型：direct/topic/fanout/headers）、Kafka（高吞吐，分区顺序消费，副本机制）、RocketMQ（事务消息，延迟消息，适合金融场景）。

如何保证消息不丢失：生产者confirm、消息持久化、消费者手动ack。如何保证幂等：唯一消息ID+数据库唯一索引/Redis set nx。

## 常见面试题及答案要点

Q: HashMap和ConcurrentHashMap的区别？
A: HashMap线程不安全，JDK8后数组+链表+红黑树（链表长度>8且数组>64时转红黑树），默认容量16，负载因子0.75；ConcurrentHashMap线程安全，JDK8后使用CAS+synchronized（只锁链表头节点），摒弃分段锁。

Q: 如何设计一个秒杀系统？
A: 前端限流（验证码/按钮置灰）→CDN静态资源→Nginx层限流→Redis预减库存（INCRBY）→消息队列异步下单→数据库最终扣减→幂等校验防超卖。

Q: 接口幂等性如何保证？
A: 唯一请求ID（token机制）+ Redis SET NX TTL；或数据库唯一索引；或乐观锁（version字段）。

Q: 如何排查线上OOM问题？
A: jmap -dump导出堆快照 → MAT/VisualVM分析大对象 → 定位代码 → 检查内存泄漏（ThreadLocal未remove/静态集合持有对象引用/内部类持有外部类引用）。
