(function ($) {

    // 插件的默认参数
    var _options = {
        outer_selector: '.roll-body',
        inner_selector: '.roll-content',
        interval: false,
        pager_selector: false
    };

    // 固定写法 $.fn.roll 需注意：roll 是插件名称
    // opts 是插件的参数
    $.fn.roll = function (opts) {

        // 将 opts 与插件默认参数，整合之后，重新赋给形参变量 opts
        opts = $.extend({}, _options, opts);

        // 将调用了此插件的jQuery对象进行循环
        this.each(function () {

            var $this = $(this),
                $roll_outer_layer = $this.find(opts.outer_selector), // 外层（body层），（position:relative; overflow:hidden; ）
                $roll_inner_layer = $this.find(opts.inner_selector), // 内层（content层），内层的宽度大于外层，实际运行的时候，是在外层相对于外层定位的（position:absolute;left:0;）
                roll_index = 0, // 标记当前应该显示第几屏内容
                p_count = $roll_inner_layer.find('li').length, // 计算，一共有多少层
                is_left = false, // 是否向左侧移动
                timer = null; // 计时器的句柄

            if (opts.pager_selector) {
                // 如果有分页导航选择器，则初始化分页导航的小点
                var $pager = $this.find(opts.pager_selector);

                for (var i = 0; i < p_count; i++) {
                    var $tmp_li = $('<li></li>');
                    if (i == 0) {
                        $tmp_li.addClass('active');
                    }
                    //每个小点对应的点击事件
                    (function (index) {
                        $tmp_li.on('touchstart', function () {
                            roll_index = index;
                            set_status();
                        });
                    })(i);
                    $pager.append($tmp_li);
                }
            }

            // 复制出插件的最后一副图片，放在第一次个
            $roll_inner_layer.children().last().clone().prependTo($roll_inner_layer)
            // 复制出插件原来的第一副图片（由于上面在最前面插入了一副图，所以现在应该是第二幅，index是1），放在最后面
            $roll_inner_layer.children().eq(1).clone().appendTo($roll_inner_layer)

            function set_status() {
                var tmp_index = roll_index;

                // 如果范围超出最后一屏或第一屏，需要做无缝滚动
                if (roll_index > p_count - 1) {
                    // 如果 index 已经超出最后一幅图了，那让 index 为 0 即应该是向第一副切换
                    // 同时，应该把整个内层的显示，放在第0副（它的内容和初始化时候的最后一幅图是相同内容）
                    // 此处 transition:none ，所以不会动画显示，由于两幅图内容相同，所以视觉上你感觉不出切换位置来
                    // 这没做，是为了给你从第一幅像左侧切换到最后副图片的时候看上去是连贯的做准备
                    roll_index = 0;
                    $roll_inner_layer.css({
                        transition: 'none',
                        left: mx
                    });
                } else if (roll_index < 0) {
                    // 如果 index 已经超出第一副图，那让 index 为 p_count-1 即第最后一幅图
                    // 同时，应该把整个内层的显示，放在最后一副（它的内容和初始化时候的第一幅图是相同内容）
                    // 此处 transition:none ，所以不会动画显示，由于两幅图内容相同，所以视觉上你感觉不出切换位置来
                    // 这没做，是为了给你从最后一幅向右侧切换第一副图片的时候看上去是连贯的做准备
                    roll_index = p_count - 1;
                    $roll_inner_layer.css({
                        transition: 'none',
                        left: $roll_outer_layer.width() * -(roll_index + 2) + mx
                    });
                }

                // 由于启用了 opts.lool ，初始化的时候在原来的图片之前插入了一副，所以 index 都会比之前 多1
                tmp_index = roll_index + 1;


                // 切换动画
                $roll_inner_layer.css({
                    transition: 'all ease 0.5s',
                    left: $roll_outer_layer.width() * -tmp_index
                });

                // 判断下是否存在分页导航，存在则将分页导航的对应小点点亮
                if (opts.pager_selector) {
                    $pager.find('li').removeClass('active');
                    $pager.find('li').eq(roll_index).addClass('active');
                }

            }

            /*
            $roll_outer_layer.on('swipeLeft', function () {
                roll_index++;
                set_status();
            });
            $roll_outer_layer.on('swipeRight', function () {
                roll_index--;
                set_status();
            });
            */

            var tx = 0, ex = 0, mx = 0;

            $roll_outer_layer.on('touchstart', function (e) {
                tx = e.touches[0].clientX;
                ex = $roll_inner_layer.position().left;
                clearInterval(timer);
                e.preventDefault();
            });

            $roll_outer_layer.on('touchmove', function (e) {
                $roll_inner_layer.css({
                    transition: 'none',
                    left: ex + (e.touches[0].clientX - tx)
                });
                e.preventDefault();
            });

            $roll_outer_layer.on('touchend', function (e) {
                mx = e.changedTouches[0].clientX - tx;
                if (mx > $roll_outer_layer.width() / 3) {
                    roll_index--;
                    is_left = true;
                    set_status();
                } else if (mx < -$roll_outer_layer.width() / 3) {
                    //left
                    roll_index++;
                    is_left = false;
                    set_status();
                } else {
                    set_status();
                }
                mx = 0;
                start_timer();
                e.preventDefault();
            });

            //$this.hover(function () {
            //    clearInterval(timer);
            //}, start_timer);

            function start_timer() {
                // 判断下，是否设置了 interval。只有设置了该参数，才开启自动滚动
                if (opts.interval) {
                    timer = setInterval(function () {
                        if (is_left) {
                            roll_index--;
                        } else {
                            roll_index++;
                        }
                        set_status();
                    }, opts.interval);
                }
            }

            // 初始化状态显示
            set_status();
            // 开始自动轮播定时器
            start_timer();
        })
    }

})(Zepto);
