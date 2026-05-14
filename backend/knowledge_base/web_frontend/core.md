# Web前端开发工程师面试知识库

## JavaScript 核心

执行上下文与作用域链：每个函数调用创建执行上下文（变量对象VO、作用域链、this），作用域链由当前上下文的变量对象和所有父级变量对象组成，词法作用域（静态作用域）在函数定义时确定。

闭包：函数与其词法环境的组合，内部函数保留对外部作用域的引用，使外部变量在函数执行完毕后不被垃圾回收。应用：模块封装、防抖/节流、柯里化。注意内存泄漏。

原型与原型链：每个对象有[[Prototype]]（__proto__），函数有prototype属性，new操作符创建对象并将__proto__指向构造函数的prototype。Object.prototype.__proto__ === null是原型链终点。instanceof检查原型链上是否存在目标prototype。

事件循环（Event Loop）：调用栈（同步）→ 微任务队列（Promise.then/queueMicrotask/MutationObserver）→ 宏任务队列（setTimeout/setInterval/I/O/requestAnimationFrame）。每次宏任务执行完后清空所有微任务。

Promise：三种状态（pending/fulfilled/rejected），链式调用then，错误冒泡catch，Promise.all（全部成功）/Promise.race（竞速）/Promise.allSettled（全部完成）/Promise.any（一个成功）。

async/await：语法糖，async函数返回Promise，await暂停执行等待Promise resolve，错误用try/catch捕获。

this指向：普通函数中this由调用方式决定（方法调用→调用对象，普通调用→全局/undefined严格模式），箭头函数this固定为定义时的上下文，call/apply/bind可显式绑定。

深拷贝实现：JSON.parse(JSON.stringify())（不支持undefined/函数/循环引用）；structuredClone（现代浏览器，支持更多类型）；手写递归（处理循环引用用WeakMap）。

防抖与节流：防抖（debounce）最后一次触发后delay执行，适合搜索输入；节流（throttle）固定时间内只执行一次，适合滚动/resize。

## Vue / React 框架

Vue3响应式原理：Proxy替代Object.defineProperty（可监听新增属性和数组变化），track（收集依赖）/trigger（触发更新），reactive/ref/computed底层实现。

Vue3生命周期：setup()→onBeforeMount→onMounted→onBeforeUpdate→onUpdated→onBeforeUnmount→onUnmounted。

Composition API vs Options API：Composition API按功能聚合代码，更好的TypeScript支持，逻辑复用用composables替代mixins。

Vue虚拟DOM与Diff算法：同层比较，key的作用（复用节点），双端比较算法（Vue2），最长递增子序列算法（Vue3，减少移动次数）。

Vue Router：hash模式（#，不需要服务端配置）vs history模式（需服务端配置所有路由返回index.html），导航守卫（全局/路由/组件级），动态路由、懒加载（()=>import()）。

Vuex/Pinia：State/Getter/Mutation（同步）/Action（异步），Pinia更简洁无Mutation，支持Composition API风格，更好的TypeScript支持。

React Hooks：useState（状态）、useEffect（副作用，依赖数组控制执行时机）、useCallback（缓存函数引用）、useMemo（缓存计算结果）、useRef（DOM引用/不触发重渲染的变量）、useContext（跨组件传值）。

React Fiber：可中断的渲染架构，将渲染任务拆分为小单元（fiber节点），通过scheduler调度优先级，支持并发模式（Concurrent Mode）。

## 浏览器原理

关键渲染路径：HTML解析→DOM树 + CSS解析→CSSOM树 → 合并→Render Tree → Layout（回流）→ Paint（重绘）→ Composite（合成）。

回流（reflow）vs重绘（repaint）：回流触发条件（尺寸/位置变化、DOM增删、字体大小改变），性能开销大；重绘只改变颜色等不影响布局的属性，开销相对小。使用transform/opacity只触发合成层，性能最佳。

浏览器缓存：强缓存（Cache-Control: max-age / Expires，直接使用缓存不请求服务器）、协商缓存（ETag/If-None-Match、Last-Modified/If-Modified-Since，304响应）。

跨域（CORS）：同源策略（协议+域名+端口相同），解决方案：服务端设置Access-Control-Allow-Origin、Nginx代理、JSONP（GET only）、postMessage、WebSocket。

安全：XSS（跨站脚本，对用户输入转义，Content-Security-Policy）、CSRF（跨站请求伪造，CSRF Token/SameSite Cookie/Referer验证）、点击劫持（X-Frame-Options: DENY）。

## 工程化工具

Webpack核心概念：Entry、Output、Loader（转换文件类型）、Plugin（扩展构建功能）、Module。常用Loader：babel-loader（ES6+转换）、css-loader/style-loader、file-loader/url-loader。常用Plugin：HtmlWebpackPlugin、MiniCssExtractPlugin、DefinePlugin。

Webpack优化：代码分割（SplitChunksPlugin）、Tree Shaking（ES Module静态分析）、懒加载（动态import）、缓存（contenthash文件名）、多进程（thread-loader）、DllPlugin（预编译公共库）。

Vite原理：开发环境基于ESM（浏览器原生模块），按需编译，无需打包；生产环境使用Rollup打包。比Webpack冷启动快10-100倍。

Babel：AST（抽象语法树）→parse→transform→generate，@babel/preset-env按browserslist转换，@babel/preset-typescript，@babel/preset-react。

## HTTP / 网络

HTTP/1.1：持久连接（keep-alive），管道化，队头阻塞问题（浏览器对同域限制6个TCP连接）。

HTTP/2：多路复用（一个TCP连接多个流）、头部压缩（HPACK）、服务器推送、二进制帧。

HTTP/3：基于QUIC（UDP），解决TCP队头阻塞，连接迁移（换网络不断线），0-RTT快速重连。

HTTPS：TLS握手过程（客户端Hello→服务端Hello+证书→客户端验证证书+生成预主密钥→生成会话密钥→加密通信），对称加密（AES）+非对称加密（RSA/ECDHE）+MAC。

常见HTTP状态码：200成功、301永久重定向、302临时重定向、304缓存、400请求错误、401未认证、403禁止、404不存在、405方法不允许、500服务器错误、502网关错误、503不可用。

## 性能优化

资源优化：图片压缩（WebP格式）、懒加载（Intersection Observer API）、预加载（<link rel="preload">）、字体优化（font-display: swap）、第三方库按需引入。

渲染优化：虚拟列表（只渲染可视区域）、Web Worker（耗时计算移出主线程）、requestAnimationFrame（动画）、防抖节流减少计算频次。

网络优化：CDN分发静态资源、HTTP/2、Gzip/Brotli压缩、减少DNS查询（DNS预解析<link rel="dns-prefetch">）、接口合并/GraphQL。

指标监控：Core Web Vitals（LCP最大内容绘制<2.5s、FID首次输入延迟<100ms、CLS累积布局偏移<0.1）、TTFB（首字节时间）、FCP（首次内容绘制）。

## 常见面试题及答案要点

Q: Vue的双向绑定原理？
A: v-model语法糖，本质是:value绑定和@input事件。响应式核心：Vue3用Proxy拦截对象操作，收集effect依赖（track），数据变化时触发（trigger）所有依赖更新。

Q: React的setState是同步还是异步？
A: React18之前：合成事件和生命周期中是异步批量更新，setTimeout中是同步；React18之后：全部自动批量更新（Automatic Batching），只有flushSync强制同步。

Q: 从输入URL到页面显示经历了什么？
A: DNS解析→TCP三次握手→HTTPS TLS握手→发送HTTP请求→服务器处理返回HTML→浏览器解析HTML构建DOM→下载CSS/JS→构建CSSOM→合并渲染树→Layout→Paint→Composite→显示。

Q: 如何优化首屏加载速度？
A: 路由懒加载、代码分割、预渲染/SSR、骨架屏、关键CSS内联、图片懒加载、CDN、开启HTTP/2、开启Gzip、减少重定向、DNS预解析。
