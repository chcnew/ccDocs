#!/bin/bash

#ubuntu20.04编译安装mysql5.7.44(最后一个5.7版本)
#命令需要root权限执行

mkdir /data
cd /data

sudo apt update
apt-get install cmake libtirpc-dev libaio1 openssl developer libssl-dev pkg-config libtirpc

wget https://sourceforge.net/projects/boost/files/boost/1.59.0/boost_1_59_0.tar.gz
tar -xvf boost_1_59_0.tar.gz
mv boost_1_59_0 /usr/local/

wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.44.tar.gz
tar -xvf mysql-5.7.44.tar.gz
cd mysql-5.7.44

mkdir build
cd build

cmake .. -DCMAKE_INSTALL_PREFIX=/usr/local/mysql \
  -DMYSQL_DATADIR=/usr/local/mysql/data \
  -DMYSQL_UNIX_ADDR=/usr/local/mysql/tmp/mysql.sock \
  -DDEFAULT_CHARSET=utf8 \
  -DDEFAULT_COLLATION=utf8mb4_general_ci \
  -DWITH_EXTRA_CHARSETS=all \
  -DWITH_INNOBASE_STORAGE_ENGINE=1 \
  -DWITH_FEDERATED_STORAGE_ENGINE=1 \
  -DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
  -DWITHOUT_EXAMPLE_STORAGE_ENGINE=1 \
  -DWITH_ZLIB=bundled \
  -DWITH_SSL=system \
  -DENABLED_LOCAL_INFILE=1 \
  -DWITH_EMBEDDED_SERVER=1 \
  -DENABLE_DOWNLOADS=1 \
  -DDOWNLOAD_BOOST=1 \
  -DWITH_BOOST=/usr/local/boost_1_59_0 \
  -DWITH_DEBUG=0

#参数说明
: '
#程序存放位置
cmake . -DCMAKE_INSTALL_PREFIX=/usr/local/mysql \
#数据存放位置
-DMYSQL_DATADIR=/usr/local/mysql/data \
#socket文件存放位置
-DMYSQL_UNIX_ADDR=/usr/local/mysql/tmp/mysql.sock \
#使用utf8字符集
-DDEFAULT_CHARSET=utf8 \
#校验规则
-DDEFAULT_COLLATION=utf8mb4_general_ci \
#使用其他额外的字符集
-DWITH_EXTRA_CHARSETS=all \
#支持的存储引擎
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=1 \
-DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
#禁用的存储引擎
-DWITHOUT_EXAMPLE_STORAGE_ENGINE=1 \
#启用zlib库支持（zib、gzib相关）
-DWITH_ZLIB=bundled \
#启用SSL库支持（安全套接层）
-DWITH_SSL=bundled \
#启用本地数据导入支持
-DENABLED_LOCAL_INFILE=1 \
#编译嵌入式服务器支持
-DWITH_EMBEDDED_SERVER=1 \
#mysql>=5.6支持了google的c++mock框架了，允许下载，否则会安装报错
-DENABLE_DOWNLOADS=1 \
#禁用debug（默认为禁用）
-DWITH_DEBUG=0
'

#编译安装
make && make install

#创建不可登录用mysql
useradd -r -g mysql -s /bin/false mysql

#文件夹目录权限修改
chown -R mysql:mysql /usr/local/mysql

#配置my.cnf
cat <<EOF > /etc/my.cnf
[client]
port=3306

[mysql]
default-character-set=utf8

[mysqld]
port=3306
basedir=/usr/local/mysql
datadir=/usr/local/mysql/data
character-set-server=utf8
default-storage-engine=InnoDB
max_connections=512

query_cache_size=0
tmp_table_size=18M
thread_cache_size=8

myisam_max_sort_file_size=64G
myisam_sort_buffer_size=35M

key_buffer_size=25M
read_buffer_size=64K
read_rnd_buffer_size=256K
sort_buffer_size=256K

innodb_flush_log_at_trx_commit=1
innodb_log_buffer_size=1M
innodb_buffer_pool_size=47M
innodb_log_file_size=24M
innodb_thread_concurrency=8
EOF

#参数说明
: '
[client] 部分：
port=3306: 指定了客户端连接 MySQL 服务器时要使用的端口号为 3306。

[mysql] 部分：
default-character-set=utf8: 指定了 MySQL 客户端默认使用的字符集为 UTF-8。

[mysqld] 部分：
port=3306: 指定了 MySQL 服务器监听的端口号为 3306。
basedir=/usr/local/mysql: 指定了 MySQL 数据库安装目录。
datadir=/usr/local/mysql/data: 指定了 MySQL 数据文件存储目录。
character-set-server=utf8: 指定了 MySQL 服务器默认使用的字符集为 UTF-8。
default-storage-engine=InnoDB: 指定了默认的存储引擎为 InnoDB。
max_connections=512: 指定了允许的最大连接数为 512。

query_cache_size=0: 禁用了查询缓存。
tmp_table_size=18M: 设置了临时表的大小为 18MB。
thread_cache_size=8: 设置了线程缓存的大小为 8。

myisam_max_sort_file_size=64G: 设置了 MyISAM 最大排序文件大小为 64GB。
myisam_sort_buffer_size=35M: 设置了 MyISAM 排序缓冲区的大小为 35MB。

key_buffer_size=25M: 设置了键缓冲区的大小为 25MB。
read_buffer_size=64K: 设置了读取操作的缓冲区大小64K。
read_rnd_buffer_size=256K: 设置了随机读取操作的缓冲区大小为256KB。
sort_buffer_size=256K: 设置了排序操作的缓冲区大小为256KB。

innodb_flush_log_at_trx_commit=1: 设置了事务提交时刷新日志的机制。
innodb_log_buffer_size=1M: 设置了 InnoDB 日志缓冲区的大小为 1MB。
innodb_buffer_pool_size=47M: 设置了 InnoDB 缓冲池的大小为 47MB。
innodb_log_file_size=24M: 设置了 InnoDB 日志文件的大小为 24MB。
innodb_thread_concurrency=8: 设置了 InnoDB 线程并发数为 8
'

#配置service -> 更习惯mysqld作为服务名
cat <<EOF > /etc/systemd/system/mysqld.service
[Unit]
Description=MySQL Server
Documentation=man:mysqld(8)d
Documentation=https://dev.mysql.com/doc/refman/en/using-systemd.html
After=network.target
After=syslog.target

[Install]
WantedBy=multi-user.target

[Service]
User=mysql
Group=mysql
ExecStart=/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf
LimitNOFILE=5000
EOF

#初始化-打印，且需要记住mysql用户：root初始密码
sudo /usr/local/mysql/bin/mysqld --initialize-insecure --user=mysql

#重新加载systemd
systemctl daemon-reload

systemctl status mysqld
systemctl start mysqld
systemctl enable mysqld

#运行安全脚本设置相关安全项
#sh /usr/local/mysql/bin/mysql_secure_installation

