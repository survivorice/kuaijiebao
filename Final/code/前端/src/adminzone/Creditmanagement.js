import React, { Component } from 'react';
import './App.css';
import {message} from "antd/lib/index";
import $ from 'jquery';


import {List, Form, Input, Tooltip, Icon, Cascader, Select, Row, Col, Checkbox, Button,Popconfirm,Table} from 'antd';

const FormItem = Form.Item;

const EditableContext = React.createContext();

function onChange(value) {
    console.log('changed', value);
}

const EditableRow = ({ form, index, ...props }) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
    state = {
        editing: false,
    }

    componentDidMount() {
        if (this.props.editable) {
            document.addEventListener('click', this.handleClickOutside, true);
        }
    }

    componentWillUnmount() {
        if (this.props.editable) {
            document.removeEventListener('click', this.handleClickOutside, true);
        }
    }

    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({editing}, () => {
            if (editing) {
                this.input.focus();
            }
        });
    }

    handleClickOutside = (e) => {
        const {editing} = this.state;
        if (editing && this.cell !== e.target && !this.cell.contains(e.target)) {
            this.save();
        }
    }

    save = () => {
        const {record, handleSave} = this.props;
        this.form.validateFields((error, values) => {
            if (error) {
                return;
            }
            this.toggleEdit();
            handleSave({...record, ...values});
        });
    }

    render() {
        const { editing } = this.state;
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            ...restProps
        } = this.props;
        return (
            <td ref={node => (this.cell = node)} {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>
                        {(form) => {
                            this.form = form;
                            return (
                                editing ? (
                                    <FormItem style={{ margin: 0 }}>
                                        {form.getFieldDecorator(dataIndex, {
                                            rules: [{
                                                required: true,
                                                message: `line is required.`,
                                            },{
                                                validator:this.checkInput
                                            }
                                            ],
                                            initialValue: record[dataIndex],
                                        })(
                                            <Input
                                                ref={node => (this.input = node)}
                                                onPressEnter={this.save}
                                            />
                                        )}
                                    </FormItem>
                                ) : (
                                    <div
                                        className="editable-cell-value-wrap"
                                        style={{ paddingRight: 24 }}
                                        onClick={this.toggleEdit}
                                    >
                                        {restProps.children}
                                    </div>
                                )
                            );
                        }}
                    </EditableContext.Consumer>
                ) : restProps.children}
            </td>
        );
    }
}



class creditmanagement extends Component {
    constructor(props) {
        super(props);
        this.columns = [ {
            title: '用户名',
            dataIndex: 'username',
        }, ,{
            title: '信用额度（可修改）',
            dataIndex: 'credit_limit',
            editable: true,
        },{
            title: '信用评分（可修改）',
            dataIndex: 'credit_level',
            editable: true,
        },{
            title: '修改',
            dataIndex: 'operation',

            render: (text, record) => {
                return (
                    <Popconfirm title="确认修改此用户的信用吗?" onConfirm={() => this.make_change(record.username)}>
                        <a href="javascript:;">修改</a>
                    </Popconfirm>
                );
            },
        }];
        this.state = {
            username:"",
            dataSource: []
        };
        this.loadlist = this.loadlist.bind(this);
    }

    getCookie= (cname) =>{
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i=0; i<ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) === 0) return c.substring(name.length,c.length);
        }
        return "";
    }

    loadlist(){
        const dataSource = [...this.state.dataSource];
        $.ajax({
            type:'GET',
            url:'/credit',
            data:{
                creditStatus:2
            },
            success:function(data){
                message.info("success");
                this.setState({
                    dataSource:JSON.parse(data)
                });
            }.bind(this),
            error:function(data){
                console.log(data)
            }
        })
    }
    make_change= (username) => {

        const dataSource = [...this.state.dataSource];
        const target = dataSource.find(user => user.username === username);
        $.ajax({
            type:"POST",
            url:'/credit',
            data:{
                creditStatus:3,
                username: target.username,
                line: target.credit_limit,
                credit:target.credit_level,
            },
            success:function(data){
                message.info("修改成功");
            }.bind(this),
            error:function(data){
                console.log(data)
            }
        });
    }

    handleSave = (row) => {
        const newData = [...this.state.dataSource];
        const index = newData.findIndex( user => row.username === user.username);
        const user = newData[index];
        newData.splice(index, 1, {
            ...user,
            ...row,
        });
        this.setState({ dataSource: newData });
    }
    componentWillMount(){

        this.loadlist()
    }
    render(){
        const {dataSource} = this.state;
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };
        const columns = this.columns.map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });
        return (
            <div>
                <Table
                    components={components}
                    rowClassName={() => 'editable-row'}
                    pagination={{
                        onChange: (page) => {
                            console.log(page);
                        },
                        pageSize: 8,
                    }}
                    bordered dataSource={dataSource} columns={columns} />
            </div>
        );
    }




}
export default creditmanagement;

