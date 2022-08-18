import React, { Component } from 'react';
import { Animated, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Modal, Text, View, Dimensions, ToastAndroid, ActivityIndicator, PermissionsAndroid, SafeAreaView, TextInput, BackHandler } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Helper from '../../../assets/Helper';
import RBSheet from "react-native-raw-bottom-sheet";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore, { firebase } from '@react-native-firebase/firestore';
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';
import Clipboard from '@react-native-clipboard/clipboard';
import * as solanaWeb3 from "@solana/web3.js";
import axios from 'axios';
import moment from 'moment';
import { NodeCameraView, NodePlayerView } from 'react-native-nodemediaclient';
import { WheelPicker } from "react-native-wheel-picker-android";
import LottieView from 'lottie-react-native';
import { BlurView as Blur_View } from "@react-native-community/blur";
import password from 'secure-random-password';


const helper = new Helper();
const sfFont = "FontsFree-Net-SFProDisplay-Regular";
const { width } = Dimensions.get('screen');

// For Comments
const userImageSize = 60;
const spacing = 0.5;
const marginBottom = 1;
const ITEM_SIZE = userImageSize + spacing * 4 + marginBottom;

const wheelPickerData = [
    "0.10 SOL",
    "0.25 SOL",
    "0.50 SOL",
    "0.75 SOL",
    "1.00 SOL",
];

const streaming_API_Token = ""



export default class GoLive extends Component {
    constructor(props) {
        super(props);
        this.state = {
            comment: "",
            comments:[],
            views:[],
            scrollY: new Animated.Value(0),
            isLive: false,
            isLiveStreaming: false,
            modalVisible: false,
            selected_SolValue: 0,
            solana: "",
            streamKey: "",
            streamId: "",
            MyUserName: this.props.route.params.userName,
            profile_Img: this.props.route.params.profile_Img,
            isDelete: false,
        };
    }




    componentDidMount() {

        this.requestCameraPermission()

        // Back handler
        this.backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            this.backAction
        );
    }


    // Back Press
    backAction = () => {

        if (!this.state.isLive) {
            this.props.navigation.goBack()
        }
        else if (this.state.isLive) {
            this.setModalVisible(!this.state.modalVisible)
        }

        return true;
    };

    componentWillUnmount() {
        this.backHandler.remove();
    }




    createLiveStream = async () => {
        // const { modalVisible } = this.state;
        this.setState({ isLiveStreaming: true })


        const res = await fetch("https://livepeer.studio/api/stream", {
            method: "POST",
            headers: {
                authorization: `Bearer ${streaming_API_Token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name: this.state.MyUserName,
                profiles: [
                    {
                        "name": "720p",
                        "bitrate": 2000000,
                        "fps": 30,
                        "width": 1280,
                        "height": 720
                    },
                    {
                        "name": "480p",
                        "bitrate": 1000000,
                        "fps": 30,
                        "width": 854,
                        "height": 480
                    },
                    {
                        "name": "360p",
                        "bitrate": 500000,
                        "fps": 30,
                        "width": 640,
                        "height": 360
                    }
                ],
            })
        })

        const meetingId = await res.json();
        console.log("resssss", meetingId)

        const streamKey = meetingId.streamKey;
        const streamId = meetingId.id;
        const streamUserName = meetingId.name;
        const playbackId = meetingId.playbackId;

        // Create Streaming collection and Doc on Others collection on firebase
        firestore()
            .collection('Accounts')
            .doc(this.state.MyUserName)
            .collection("Streamings")
            .doc("Streaming")
            .set({
                StreamKey: streamKey,
                Comments: [],
                Views: [],
                Id: streamId,
                Profile_Img: this.state.profile_Img,
                UserName: this.state.MyUserName,
                PlaybackId: playbackId,
            }).then(() => {
                this.setState({
                    isLiveStreaming: false,
                    isLive: true,
                    streamKey: streamKey,
                    streamId: streamId,
                })
                this.callCommentFunction()
                // this.setModalVisible(!modalVisible)
                // this.props.navigation.navigate("GoLive", {
                //     streamKey: streamKey,
                //     streamId: streamId,
                //     streamUserName: streamUserName,
                // })
                setTimeout(() => {
                    this.nodeCameraViewRef.start()
                    this.requestCameraPermission()
                    this.scrollToEnd()
                }, 1000);
            })

        return meetingId;
    }


    callCommentFunction=()=>{
            setInterval(() => {
                this.getComments();
                this.getViews();
            }, 4000);
            // return null;
    }

    deleteStream = async () => {
        this.setState({ isDelete: true, isLiveStreaming: true, Views: [] })
        const streamId = this.state.streamId

        const res = await fetch(`https://livepeer.studio/api/stream/${streamId}`, {
            method: "DELETE",
            headers: {
                authorization: `Bearer ${streaming_API_Token}`,
            }
        }).then((value) => {
            console.log("Deleted Response", value.status)

            // Deleting firebase doc for streaming
            firestore()
                .collection("Accounts")
                .doc(this.state.MyUserName)
                .collection("Streamings")
                .doc("Streaming")
                .delete()
                .then(() => {
                    this.nodeCameraViewRef.stop()
                    this.nodeCameraViewRef.stopPreview()
                    // this.getComments()
                    // this.props.navigation.goBack()
                    this.setState({
                        isDelete: false,
                        isLive: false,
                        isLiveStreaming: false,
                    })

                    // this.stopCallingFunction()
                })
                .catch((value) => {
                    console.log("eeeer", value)
                })
        })

        return res;
    }




    goLive = () => {
        this.createLiveStream()
    }


    stopLive = () => {
        this.deleteStream()
    }


    setCameraRef = (ref) => {
        this.nodeCameraViewRef = ref;
    };


    onSolValueSelected = selected_SolValue => {
        this.setState({ selected_SolValue });

        console.log(selected_SolValue)
    };



    solValue_Function = () => {
        if (this.state.selected_SolValue == 0) {
            this.setState({ solana: "0.10" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 1) {
            this.setState({ solana: "0.25" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 2) {
            this.setState({ solana: "0.50" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 3) {
            this.setState({ solana: "0.75" });
            // this.RBSheet_Age.close()
        }
        else if (this.state.selected_SolValue == 4) {
            this.setState({ solana: "1.00" });
            // this.RBSheet_Age.close()
        }
    }


    send_Comment_ToFirebase=()=>{

        const recoveryPhrase = password.randomPassword({ length: 10, characters: [password.lower, password.upper, password.digits] })

        if(this.state.comment == ""){
            return null;
        }
        else{
            firestore()
                .collection("Accounts")
                .doc(this.state.MyUserName)
                .collection("Streamings")
                .doc("Streaming")
                .update({
                    Comments: firestore.FieldValue.arrayUnion(
                        {
                            id: recoveryPhrase,
                            profile_Img: this.state.profile_Img,
                            userName: this.state.MyUserName,
                            comment: this.state.comment,
                        }
                    )
                })
                .then(() => {
                    this.setState({ comment: "" }),
                    this.getComments()
                })
        }
    }




    getComments=()=>{
        const getComments = firestore()
            .collection("Accounts")
            .doc(this.state.MyUserName)
            .collection("Streamings")
            .doc("Streaming")
            .get()
            .then((querySnapshot) => {
                // console.log("]]]]]]]]]]]]]]]]]]]", querySnapshot.data())
                const comments = querySnapshot.data().Comments
                this.setState({
                    comments: comments
                })
                this.scrollToEnd()
            })
        
        return getComments;
    }



    getViews = () => {
        firestore()
            .collection("Accounts")
            .doc(this.state.MyUserName)
            .collection("Streamings")
            .doc("Streaming")
            .get()
            .then((query) => {
                this.setState({
                    views: query.data().Views
                })
            })
        // .onSnapshot(onSnapshot=>{
        //     // console.log("===+",onSnapshot.data().Views)
        //     this.setState({
        //         views: onSnapshot.data().Views
        //     })
        // })
    }



    scrollToEnd = () => {
        this.flatlistRef.scrollToEnd({ animating: true })
    }


    requestCameraPermission = async () => {
        try {
            const granted = await PermissionsAndroid.requestMultiple(
                [PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
                {
                    title: 'Fiyer need Camera And Microphone Permission',
                    message:
                        'Fiyer needs access to your camera so you can take awesome pictures.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            if (
                granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
            ) {
                if (this.nodeCameraViewRef) this.nodeCameraViewRef.startPreview();
            } else {
                Logger.log('Camera permission denied');
            }
        } catch (err) {
            Logger.warn(err);
        }
    };



    setModalVisible = (visible) => {
        this.setState({ modalVisible: visible });
    }



    render() {
        const {
            scrollY,
            streamKey,
            modalVisible,
            comments,
        } = this.state;

        return (
            <SafeAreaView style={{ ...styles.container }}>
                <StatusBar backgroundColor={"transparent"} translucent />

                {/* Camera for streaming */}
                <NodeCameraView
                    style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'gray', position: "absolute" }}
                    ref={this.setCameraRef}
                    outputUrl={`rtmp://rtmp.livepeer.com/live/${streamKey}`}
                    camera={{ cameraId: 1, cameraFrontMirror: true, }}
                    audio={{ bitrate: 32000, profile: 1, samplerate: 44100 }}

                    video={{
                        preset: 12,
                        bitrate: 400000,
                        profile: 1,
                        fps: 15,
                        videoFrontMirror: false,
                    }}
                    autopreview={true}
                />

                {/* Header View */}
                <View style={{ ...styles.headerView }}>
                    <View style={{ ...styles.headerInnerViews, justifyContent: "flex-start", }}>

                        {this.state.isLiveStreaming &&
                            <View style={{
                                width: "45%",
                                height: 25,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <ActivityIndicator size="small" color={"#FFFFFF"} />
                            </View>}

                        {/* go Live BTN */}
                        {!this.state.isLive && !this.state.isLiveStreaming &&
                            <TouchableOpacity style={{ ...styles.headerButtons }}
                                onPress={() => { this.goLive() }}
                            >
                                <Text style={{ ...styles.headerText, fontSize: 15 }}>Go Live</Text>
                            </TouchableOpacity>}

                        {/* Stop BTN */}
                        {this.state.isLive && !this.state.isLiveStreaming &&
                            <TouchableOpacity style={{ ...styles.headerButtons }}
                                onPress={() => { this.stopLive() }}
                            >
                                <Text style={{ ...styles.headerText, fontSize: 15 }}>Stop</Text>
                            </TouchableOpacity>}
                    </View>

                    {/* live status and Views */}
                    <View style={{ ...styles.headerInnerViews }}>
                        {/* Live status */}
                        <View style={{ ...styles.headerTabs, width: "25%", marginRight: 5, backgroundColor: "#FFFFFF77", }}>
                            <View style={{ ...styles.dot, backgroundColor: this.state.isLive ? "#FFFFFF" : "#000000", }} />
                            <Text style={{ ...styles.headerText }}>{this.state.isLive ? "Live" : "Idle"}</Text>
                        </View>
                        {/* Views */}
                        <View style={{ ...styles.headerTabs }}>
                            <Ionicons name={"eye"} size={12} color={"#ffffff"} />
                            <Text style={{ ...styles.headerText, color: "#ffffff" }}>{this.state.views.length}</Text>
                        </View>
                    </View>
                </View>

                {/* Comments View */}
                {this.state.isLive &&
                    <View style={{ ...styles.commentsView }}>
                        {/* FlatList */}
                        <Animated.FlatList
                            onScroll={
                                Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                    { useNativeDriver: true }
                                )
                            }
                            data={comments}
                            // ref={this.flatlistRef}
                            ref={ref => {
                                this.flatlistRef = ref;
                            }}
                            // inverted
                            keyExtractor={(item, index) => item + index}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            renderItem={({ item, index }) => {

                                const inputRange = [
                                    -1,
                                    0,
                                    ITEM_SIZE * index,
                                    ITEM_SIZE * (index + 2),
                                ]
                                const scale = scrollY.interpolate({
                                    inputRange, 
                                    outputRange: [1, 1, 1, 0]
                                })

                                const OpacityInputRange = [
                                    -40,
                                    0,
                                    ITEM_SIZE * index,
                                    ITEM_SIZE * (index + .7),
                                ]
                                const opacity = scrollY.interpolate({
                                    inputRange: OpacityInputRange,
                                    outputRange: [1, 1, 1, 0]
                                })
                                return (
                                    // Comments Animated View
                                    <Animated.View style={{
                                        width: "100%",
                                        height: 60,
                                        marginTop: 5,
                                        flexDirection: "row",
                                        alignItems: 'center',
                                        transform: [{ scale }], opacity,
                                    }}>
                                        {/* Profile */}
                                        <View style={{ width: "20%", alignItems: 'center', }}>
                                            <View>
                                                <Image source={{uri:item.profile_Img}}
                                                    style={{ ...styles.user_Image }}
                                                />
                                            </View>
                                        </View>
                                        {/* Name & Comment */}
                                        <View style={{ width: "80%" }}>
                                            <Text style={{ ...styles.user_Details }} numberOfLines={1}>{item.userName}</Text>
                                            <Text style={{ ...styles.user_Details, fontSize: 10, width: "90%" }} numberOfLines={3} >{item.comment}</Text>
                                        </View>
                                    </Animated.View>
                                )
                            }}
                        />
                    </View>}

                {/* Footer View */}
                {this.state.isLive &&
                <View style={{ ...styles.footerView }}>
                    {/* Comment TextInput */}
                    {/* <View style={{ width: "100%" }}>
                        <TextInput
                            style={{ ...styles.TextInputStyle }}
                            onChangeText={(value) => this.setState({ comment: value })}
                            value={this.state.comment}
                            placeholder={"Comment..."}
                            placeholderTextColor={"#D1D1D1"}
                        />
                        <TouchableOpacity style={{
                            position: "absolute",
                            right: 0,
                            top: 10,
                        }}
                            onPress={() => { this.send_Comment_ToFirebase() } }
                        >
                            <Text style={{ ...styles.footerText }}>Send</Text>
                        </TouchableOpacity>
                    </View> */}

                    {/* Send Gift */}
                    {/* <TouchableOpacity
                        onPress={() => { this.RBSheet_Tip.open() }}
                        style={{
                            backgroundColor: "#ffffff",
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Image
                            source={require("../../../icons/solana.png")}
                            style={{ ...styles.giftIcon }}
                        />
                    </TouchableOpacity> */}
                </View>}

                {/* Give a tip sheet */}
                <RBSheet
                    ref={ref => {
                        this.RBSheet_Tip = ref;
                    }}
                    animationType={'slide'}
                    height={320}
                    openDuration={250}
                    closeDuration={250}
                    // closeOnDragDown={true}
                    customStyles={{
                        container: {
                            borderTopEndRadius: 15,
                            borderTopStartRadius: 15,
                            backgroundColor: "#000000",
                        },
                        wrapper: {
                            backgroundColor: "#00000000",
                        },
                        draggableIcon: {
                            backgroundColor: "#ffffff"
                        }
                    }}
                >
                    <SafeAreaView style={{
                        width: "100%",
                        height: "100%",
                        justifyContent: "space-evenly",
                        alignItems: 'center',
                    }}>
                        {/* Solana logo */}
                        <View style={{
                            width: 32,
                            height: 32,
                            borderWidth: 0.7,
                            borderRadius: 100,
                            borderColor: "#ffffff",
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Image
                                source={require("../../../icons/solana.png")}
                                style={{
                                    width: 18,
                                    height: 18,
                                }}
                            />
                        </View>

                        {/* Sol Wheel Picker */}
                        <WheelPicker
                            selectedItem={this.state.selected_SolValue}
                            data={wheelPickerData}
                            onItemSelected={this.onSolValueSelected}
                            isCyclic={true}
                            selectedItemTextColor={"#FFFFFF"}
                            itemTextColor={"#797979"}
                            indicatorColor={"#000000"}
                            selectedItemTextSize={20}
                            itemTextSize={18}
                            selectedItemTextFontFamily={sfFont}
                        >
                        </WheelPicker>

                        <View style={{ ...styles.sheet_arrowStyle }} >
                            <AntDesign name={"right"} size={18} color={"#ffffff"} />
                        </View>

                        {/* Tip Btn */}
                        <TouchableOpacity style={{
                            width: "35%",
                            height: 35,
                            backgroundColor: "#ffffff",
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 4,
                        }}>
                            <Text style={{
                                fontFamily: sfFont,
                                fontSize: 17,
                                color: "#000000",
                            }}>Give a tip</Text>
                        </TouchableOpacity>

                    </SafeAreaView>
                </RBSheet>


                {/* Modal for back btn */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    statusBarTranslucent={true}
                    onRequestClose={() => {
                        this.setModalVisible(!modalVisible);
                    }}
                >

                    {/* Centerd View */}
                    <View style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: 'center',
                        backgroundColor: "#00000000",
                    }}>

                        <View style={{
                            backgroundColor: "#000000",
                            width: "85%",
                            height: 200,
                            borderRadius: 10,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: "#fff",
                        }}>
                            {/* Cross icon View */}
                            <View style={{
                                width: "95%",
                                alignSelf: 'center',
                                alignItems: "flex-end",
                                marginTop: 8,
                            }}>
                                <TouchableOpacity
                                    onPress={() => { this.setModalVisible(!modalVisible) }}
                                >
                                    <LottieView
                                        ref={animation => {
                                            this.animation = animation;
                                        }}
                                        source={require('../../Json/cross2.json')}
                                        autoPlay={true}
                                        loop={true}
                                        duration={2000}
                                        style={{
                                            width: 25,
                                            height: 25,
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>


                            <Text style={{
                                alignSelf: 'center',
                                textAlign: "center",
                                marginTop: 35,
                                fontFamily: sfFont,
                                fontSize: 16,
                                color: "#ffffff",
                            }}>Are you sure you want to exit?</Text>


                            {/* Create stream Btn */}
                            <View style={{ width: "70%", alignSelf: "center", marginTop: 40, }}>
                                {this.state.isBacked &&
                                    <View style={{
                                        width: "90%",
                                        height: 37,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        alignSelf: 'center',
                                    }}>
                                        <ActivityIndicator size="small" color={"#FFFFFF"} />
                                    </View>
                                }
                                {/* yes Btn */}
                                {!this.state.isBacked &&
                                    <TouchableOpacity style={{
                                        width: "50%",
                                        height: 37,
                                        backgroundColor: "#FFFFFF",
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        alignSelf: 'center',
                                    }}
                                        onPress={() => { this.deleteStream() }}
                                    >
                                        <Text style={{
                                            fontFamily: sfFont,
                                            fontSize: 14,
                                            color: "#000000",
                                        }}>Yes</Text>
                                    </TouchableOpacity>}
                            </View>

                        </View>

                    </View>
                </Modal>


            </SafeAreaView>
        );
    }
}





const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#020202",
    },
    headerView: {
        width: "92%",
        alignSelf: 'center',
        marginTop: "14%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
    },
    headerInnerViews: {
        width: "50%",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: 'center',
    },
    headerTabs: {
        width: "30%",
        height: 20,
        backgroundColor: "#0000006B",
        borderRadius: 4,
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: 'center',
    },
    headerButtons: {
        width: "45%",
        height: 25,
        backgroundColor: "#ffffff",
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontFamily: sfFont,
        fontSize: 11,
        color: "#000000",
        bottom: 1,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 50,
    },
    footerView: {
        width: "92%",
        alignSelf: 'center',
        position: "absolute",
        bottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
    },
    giftIcon: {
        width: 28,
        height: 28,
        // tintColor: "#ffffff",
    },
    TextInputStyle: {
        width: "97%",
        height: 40,
        borderWidth: 0.5,
        borderColor: "#FFFFFF",
        borderRadius: 4,
        alignSelf: "center",
        color: "#FFFFFF",
        fontFamily: sfFont,
        paddingRight: 50,
        paddingLeft: 10,
    },
    footerText: {
        fontFamily: sfFont,
        fontSize: 14,
        color: "#ffffff",
        marginRight: 15,
    },
    user_Image: {
        width: 45,
        height: 45,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: "#ffffff",
    },
    user_Details: {
        fontFamily: sfFont,
        fontSize: 14,
        color: "#ffffff",
        width: "100%",
    },
    commentsView: {
        width: "90%",
        height: 250,
        alignSelf: 'center',
        position: "absolute",
        bottom: 60,
    },
    sheet_arrowStyle: {
        position: "absolute",
        top: "46.7%",
        left: "32%"
        // marginTop:40
    },

})